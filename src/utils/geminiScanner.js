import { addIncident, serverTimestamp, checkLinkExists } from "../firebaseConfig";
import { REGIONS } from "../regionData";

const API_KEY = "AIzaSyBMzuxV7fzGK6OvIpMzX2OiTEuwfYaKg58"; // Key của bạn

// GIẢM SỐ LƯỢNG RSS ĐỂ TRÁNH LỖI 500 (SERVER QUÁ TẢI)
const RSS_FEEDS = [
  "https://vnexpress.net/rss/thoi-su.rss",
  "https://tuoitre.vn/rss/thoi-su.rss",
  "https://dantri.com.vn/rss/xa-hoi.rss",
  // Tạm tắt bớt các nguồn khác để test ổn định trước
  // "https://thanhnien.vn/rss/thoi-su.rss",
];

const VALID_KEYWORDS = [
  'kêu cứu', 'mắc kẹt', 'cô lập', 'mất tích', 'vỡ đê', 'lũ quét',
  'sạt lở', 'ngập sâu', 'chìm tàu', 'cứu hộ', 'sơ tán', 'cháy lớn',
  'bão số', 'áp thấp nhiệt đới', 'tin bão', 'dự báo mưa lớn',
  'xả lũ', 'cảnh báo lũ', 'hướng di chuyển của bão', 'động đất', 'tai nạn'
];

const IGNORE_KEYWORDS = [
  'bóng đá', 'thể thao', 'showbiz', 'hoa hậu', 'tỷ giá', 'chứng khoán',
  'khai mạc', 'hội nghị', 'bắt giữ', 'tuyên án', 'tham nhũng', 'xổ số', 'kỷ luật'
];

const cleanJsonString = (str) => {
  if (!str) return "{}";
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    let jsonStr = str.substring(firstBrace, lastBrace + 1);
    return jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
  }
  return "{}";
};

// 🔥 [MỚI] HÀM TRÍCH XUẤT ẢNH THẬT TỪ RSS 🔥
// Hàm này sẽ tìm thẻ <img src="..."> trong mô tả bài báo.
// Nếu tìm thấy -> Trả về link ảnh.
// Nếu KHÔNG tìm thấy -> Trả về null (Không dùng ảnh mẫu nữa).
function extractImageFromRSS(description) {
  if (!description) return null;
  // Regex tìm thuộc tính src bên trong thẻ img
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = description.match(imgRegex);

  // Nếu tìm thấy và link bắt đầu bằng http (để tránh ảnh rác)
  if (match && match[1] && match[1].startsWith('http')) {
    return match[1]; // Trả về link ảnh thật
  }
  return null; // Không có ảnh thật thì trả về null
}

const isRecent = (pubDateStr) => {
  if (!pubDateStr) return true;
  const pubDate = new Date(pubDateStr);
  const now = new Date();
  const diffHours = (now - pubDate) / (1000 * 60 * 60);
  return diffHours <= 24;
};

async function fetchRSS(url) {
  try {
    const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    const response = await fetch(api);

    // Xử lý khi RSS server lỗi (500, 404...)
    if (!response.ok) {
        console.warn(`⚠️ Bỏ qua nguồn lỗi: ${url}`);
        return [];
    }

    const data = await response.json();

    if (data.status === 'ok' && data.items) {
      return data.items.filter(item => {
        // Đảm bảo title và description luôn là chuỗi, không được null
        const title = item.title || "";
        const desc = item.description || "";
        const text = (title + " " + desc).toLowerCase();

        const hasKeyword = VALID_KEYWORDS.some(kw => text.includes(kw));
        const hasIgnore = IGNORE_KEYWORDS.some(kw => text.includes(kw));
        const isNew = isRecent(item.pubDate);

        return hasKeyword && !hasIgnore && isNew;
      });
    }
    return [];
  } catch (error) {
    console.error(`Lỗi RSS ${url}:`, error);
    return [];
  }
}

async function getCoordinatesFromAddress(address) {
  if (!address || address === "Việt Nam") return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=vn&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'RescueMapApp/1.0' } });
    const data = await response.json();
    if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (error) { console.warn("Lỗi Geocoding:", error); }
  return null;
}

async function callGeminiDirectly(promptText) {
  const MODEL_CANDIDATES = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

  for (const model of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`;
    const payload = { contents: [{ parts: [{ text: promptText }] }] };

    try {
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (!response.ok) continue;
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {console.warn(error) ; continue; }
  }
  return null;
}

// === LOGIC CHÍNH ===
export const scanNewsWithAI = async () => {
  console.log("🚀 [System] Bắt đầu quét đa luồng...");
  let countAdded = 0;

  try {
    let candidates = [];
    for (const feed of RSS_FEEDS) {
      const articles = await fetchRSS(feed);
      candidates = [...candidates, ...articles];
    }

    if (candidates.length === 0) {
      console.log("📭 Không có tin mới hoặc lỗi kết nối RSS.");
      return null;
    }

    console.log(`🔎 Tìm thấy ${candidates.length} tin tiềm năng. Đang lọc...`);

    let articlesToProcess = [];
    for (const item of candidates) {
        if (articlesToProcess.length >= 3) break; // GIẢM XUỐNG 3 TIN ĐỂ ỔN ĐỊNH

        // Kiểm tra an toàn item.link
        if (!item.link) continue;

        const exists = await checkLinkExists(item.link);
        if (!exists) {
            articlesToProcess.push(item);
        }
    }

    if (articlesToProcess.length === 0) {
        console.log("✅ Tất cả tin đều đã có trên hệ thống.");
        return null;
    }

    console.log(`⚡ Đang phân tích ${articlesToProcess.length} tin mới...`);

    for (const article of articlesToProcess) {
         const prompt = `
          Phân tích tin sau và trả về JSON thuần túy.
          Tin: "${article.title} - ${article.description}"
          Format JSON:
          {
            "is_relevant": true/false (true nếu là thiên tai/lũ/bão/cứu nạn/cháy/tai nạn),
            "title": "Tiêu đề ngắn gọn (dưới 10 từ)",
            "location_query": "Địa danh hành chính cụ thể nhất (Xã/Huyện/Tỉnh)",
            "type": "rescue" (cần cứu) hoặc "warning" (cảnh báo) hoặc "news" (tin tức)
          }
        `;

        const aiText = await callGeminiDirectly(prompt);
        if (!aiText) continue;

        let finalData;
        try { finalData = JSON.parse(cleanJsonString(aiText)); } catch (e) { console.warn(e) ; continue; }

        if (!finalData.is_relevant) continue;

        // Nếu AI trả về location_query là null, gán chuỗi rỗng để không bị lỗi
        const locationQuery = finalData.location_query || "";

        let lat = 10.7769, lng = 106.7009;
        const geoData = await getCoordinatesFromAddress(locationQuery);

        if (geoData) {
            lat = geoData.lat; lng = geoData.lng;
        } else {
             // Tìm trong REGIONS (có kiểm tra null)
             const region = REGIONS.find(r =>
                locationQuery.toLowerCase().includes(r.name.toLowerCase())
             );
             if (region) { lat = region.center[0]; lng = region.center[1]; }
        }

        // 🔥 [THAY ĐỔI QUAN TRỌNG Ở ĐÂY] 🔥
        // Sử dụng hàm mới để lấy ảnh thật.
        const realImage = extractImageFromRSS(article.description);

        const incidentData = {
          type: finalData.type || "news", // Nếu AI quên type thì mặc định là news
          title: finalData.title || article.title,
          description: (article.description || "").replace(/<[^>]*>?/gm, ''),
          sourceLink: article.link,
          location: locationQuery || "Chưa xác định",
          lat, lng,
          // Gán ảnh thật vào đây. Nếu không có thì nó sẽ là null.
          image: realImage,
          status: 'pending',
          time: serverTimestamp()
        };

        await addIncident(incidentData);
        countAdded++;
        console.log(`💾 Đã lưu: ${finalData.title}`);
    }

    if (countAdded > 0) {
        return { title: `Đã thêm ${countAdded} tin mới` };
    } else {
        return { title: "Hoàn tất quét (không có tin hợp lệ)" };
    }

  } catch (error) {
    console.error("❌ Lỗi Scan:", error);
    return null;
  }
};