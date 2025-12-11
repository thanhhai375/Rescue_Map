import { addIncident, serverTimestamp, checkLinkExists } from "../config/firebaseConfig";
import { REGIONS } from "../constants/regionData";

const API_KEY = "AIzaSyA3LemNa_SXPjM03-iXagSNoFHTYX5LqtQ"; // Key của bạn

// 1. MỞ RỘNG NGUỒN TIN: Thêm các chuyên mục Xã hội, Nhân ái, Sức khỏe
const RSS_FEEDS = [
  "https://vnexpress.net/rss/thoi-su.rss",
  "https://dantri.com.vn/rss/tam-long-nhan-ai.rss", // Quan trọng: Chuyên mục từ thiện
  "https://dantri.com.vn/rss/xa-hoi.rss",
  "https://vietnamnet.vn/rss/ban-doc.rss", // Quan trọng: Các hoàn cảnh cần giúp
  "https://thanhnien.vn/rss/doi-song.rss",
  "https://vtcnews.vn/rss/xa-hoi.rss",
  "https://congan.com.vn/rss/tu-thien.rss" // Chuyên mục từ thiện báo Công An
];

// 2. MỞ RỘNG TỪ KHÓA: Bao quát cả nhu yếu phẩm, tìm người, từ thiện
const VALID_KEYWORDS = [
  // Cứu hộ khẩn cấp
  'kêu cứu', 'mắc kẹt', 'cô lập', 'mất tích', 'vỡ đê', 'lũ quét', 'sạt lở',
  'ngập sâu', 'cháy lớn', 'bão số', 'động đất', 'tai nạn nghiêm trọng',

  // Cần hỗ trợ / Nhu yếu phẩm
  'hoàn cảnh', 'khó khăn', 'cần giúp đỡ', 'nhà sập', 'màn trời chiếu đất',
  'thiếu nước', 'lương thực', 'nhu yếu phẩm', 'đói rét', 'rét đậm',
  'hỗ trợ khẩn cấp', 'kêu gọi', 'ủng hộ', 'quyên góp', 'mạnh thường quân',

  // Y tế / Sức khỏe
  'cấp cứu', 'hiến máu', 'nhóm máu hiếm', 'bệnh hiểm nghèo', 'không tiền chữa trị',

  // Tìm người / Cộng đồng
  'tìm người thân', 'đi lạc', 'bỏ nhà', 'thất lạc', 'tìm trẻ lạc'
];

// Lọc bớt các tin rác không liên quan
const IGNORE_KEYWORDS = [
  'bóng đá', 'thể thao', 'showbiz', 'hoa hậu', 'tỷ giá', 'chứng khoán', 'bất động sản',
  'khai mạc', 'hội nghị', 'bắt giữ', 'tuyên án', 'tham nhũng', 'xổ số', 'kỷ luật',
  'lễ hội', 'du lịch', 'giải trí', 'review', 'quảng cáo'
];

// --- CÁC HÀM TIỆN ÍCH (UTILS) ---

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
};

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

function extractImageFromRSS(item) {
  if (item.enclosure && item.enclosure.link) return item.enclosure.link;
  if (item.thumbnail && item.thumbnail.startsWith('http')) return item.thumbnail;
  const description = item.description || "";
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = description.match(imgRegex);
  if (match && match[1] && match[1].startsWith('http')) {
    const imgUrl = match[1];
    const junk = ['icon', 'logo', 'share', 'button', 'pixel', 'avatar', 'banner', 'ads'];
    if (junk.some(kw => imgUrl.toLowerCase().includes(kw))) return null;
    return imgUrl;
  }
  return null;
}

const SPECIAL_LOCATIONS = {
    "biển đông": { lat: 16.5, lng: 112.0 },
    "hoàng sa": { lat: 16.4, lng: 111.6 },
    "trường sa": { lat: 8.6, lng: 111.9 },
    "vịnh bắc bộ": { lat: 20.0, lng: 107.5 },
};

// --- LOGIC GỌI API ---

async function fetchRSS(url) {
  try {
    const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    const response = await fetch(api);
    if (!response.ok) return [];
    const data = await response.json();
    if (data.status === 'ok' && data.items) {
      return data.items.filter(item => {
        const title = (item.title || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const text = title + " " + desc;

        // Lấy tin trong 48h để có nhiều dữ liệu hơn (thay vì 24h)
        const pubDate = new Date(item.pubDate);
        const isNew = (new Date() - pubDate) / (3600000) <= 48;

        const hasKeyword = VALID_KEYWORDS.some(kw => text.includes(kw));
        const hasIgnore = IGNORE_KEYWORDS.some(kw => text.includes(kw));

        return hasKeyword && !hasIgnore && isNew;
      });
    }
    return [];
  } catch (error) {
    console.error(`Lỗi RSS:`, error);
    return [];
  }
}

async function getCoordinates(query) {
  if (!query) return null;
  const cleanQuery = query.toLowerCase().trim();

  // Kiểm tra xem query có phải là tên Tỉnh/Thành phố không
  const normalizedQuery = removeAccents(cleanQuery);
  const matchedRegion = REGIONS.find(r => {
      const regionNameNorm = removeAccents(r.name);
      // So sánh tương đối: "tinh quang ngai" so với "quang ngai"
      return normalizedQuery.includes(regionNameNorm) || regionNameNorm.includes(normalizedQuery);
  });

  // Nếu tìm thấy trong danh sách tỉnh -> Chắc chắn là tin chung chung (isRegion = true)
  // Dù sau này có lấy được tọa độ từ API thì vẫn giữ cờ này
  const isRegionName = !!matchedRegion;

  if (SPECIAL_LOCATIONS[cleanQuery]) return { ...SPECIAL_LOCATIONS[cleanQuery], isRegion: true };

  // 1. Tìm API
  try {
    await delay(1000);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'RescueMapApp/2.0' } });
    const data = await res.json();
    if (data && data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            // 🔥 QUAN TRỌNG: Nếu tên khớp với Tỉnh, ép buộc isRegion = true
            isRegion: isRegionName
        };
    }
  } catch (e) { console.warn("Lỗi API Map, chuyển sang tìm Local...",e); }

  // 2. Fallback (Nếu API lỗi hoặc không tìm thấy, lấy tọa độ cứng của tỉnh)
  if (matchedRegion) {
      return {
          lat: matchedRegion.center[0],
          lng: matchedRegion.center[1],
          isRegion: true
      };
  }
  return null;
}

// Hàm gọi AI (Fallback models)
async function callGeminiDirectly(promptText) {
  const MODELS = [ "gemini-2.5-flash","gemini-3.0","gemini-3.0-pro","gemini-2.0-flash","gemini-1.5-flash", "gemini-1.5-pro"];

  for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      const payload = {
        contents: [{ parts: [{ text: promptText }] }]
      };

      try {
        const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!response.ok) continue;
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (e) { console.warn(e); }
  }
  return null;
}

// === MAIN FUNCTION ===
export const scanNewsWithAI = async () => {
  console.log("🚀 [System] Bắt đầu quét tin tức mở rộng...");
  let countAdded = 0;

  try {
    // 1. Lấy RSS
    let candidates = [];
    // Chạy song song nhưng giới hạn để không spam request
    const feedResults = await Promise.all(RSS_FEEDS.map(feed => fetchRSS(feed)));
    feedResults.forEach(items => candidates = [...candidates, ...items]);

    if (candidates.length === 0) {
        console.log("⚠️ Không tìm thấy tin nào khớp từ khóa.");
        return null;
    }

    // 2. Lọc tin trùng & Giới hạn số lượng gửi cho AI (Tăng lên 15 tin)
    let articles = [];
    for (const item of candidates) {
        if (articles.length >= 15) break;
        if (item.link && !(await checkLinkExists(item.link))) {
            articles.push(item);
        }
    }

    if (articles.length === 0) {
        return null;
    }

    console.log(`⚡ Phân tích ${articles.length} tin tiềm năng...`);

    // 3. Phân tích từng tin với PROMPT MỚI
    for (const article of articles) {
          await delay(2000);

          // 🔥 PROMPT ĐƯỢC NÂNG CẤP ĐỂ HIỂU NHIỀU NGỮ CẢNH HƠN 🔥
          const prompt = `
          Bạn là trợ lý AI cho ứng dụng "Bản Đồ Cứu Hộ". Hãy phân tích tin tức sau:
          Tiêu đề: "${article.title}"
          Mô tả: "${article.description}"

          Nhiệm vụ:
          1. Xác định ĐỊA ĐIỂM cụ thể nhất (Xã/Phường/Quận/Huyện/Tỉnh). Nếu không có, trả về null.
          2. Phân loại tin (type) vào 1 trong 4 nhóm sau:
             - "rescue": Khẩn cấp, nguy hiểm tính mạng (cháy, lũ quét, sập nhà, tai nạn).
             - "help": Các hoàn cảnh khó khăn CẦN GIÚP ĐỠ (bệnh tật, nghèo đói, thiếu nhu yếu phẩm, kêu gọi quyên góp).
             - "warning": Cảnh báo thiên tai, bão lũ, đường sạt lở (chưa xảy ra hoặc đang diễn ra diện rộng).
             - "news": Tin tức phục hồi sau thiên tai, hoạt động cộng đồng, tìm người thất lạc.

          3. Đánh giá mức độ phù hợp (is_relevant):
             - TRUE nếu bài viết kêu gọi sự giúp đỡ, cảnh báo an toàn, hoặc thông tin cứu trợ.
             - FALSE nếu là tin giải trí, chính trị, bắt tội phạm không liên quan đến cứu hộ/cứu trợ.

          Trả về JSON format duy nhất (không markdown):
          { "is_relevant": boolean, "title": string, "location_query": string, "type": "rescue"|"help"|"warning"|"news" }
        `;

        const aiText = await callGeminiDirectly(prompt);
        if (!aiText) continue;

        let finalData;
        try { finalData = JSON.parse(cleanJsonString(aiText)); } catch (e) {console.warn(e); continue; }

        if (!finalData.is_relevant) continue;

        // 4. Tìm tọa độ
        const locationQuery = finalData.location_query || "";
        let lat = 16.0544, lng = 108.2022; // Mặc định tâm VN
        let zoomLevel = 6;
        let isGeneral = true;

        if (locationQuery) {
            const coords = await getCoordinates(locationQuery);
            if (coords) {
                lat = coords.lat;
                lng = coords.lng;
                zoomLevel = 14; // Tìm thấy thì zoom gần
                isGeneral = false;
            } else {
                 console.log(`⚠️ Không tìm thấy tọa độ: ${locationQuery}, dùng vị trí tượng trưng.`);
                 // Nếu không tìm thấy tọa độ cụ thể nhưng AI trích xuất được Tên Tỉnh,
                 // Code getCoordinates ở trên đã có fallback tìm trong REGIONS rồi.
            }
        }

        const realImage = extractImageFromRSS(article);

        await addIncident({
          type: finalData.type || "news",
          title: finalData.title || article.title,
          description: (article.description || "").replace(/<[^>]*>?/gm, '').substring(0, 300) + "...",
          sourceLink: article.link,
          location: locationQuery || "Việt Nam",
          lat, lng,
          zoomLevel: zoomLevel, // Lưu mức zoom để hiển thị map tốt hơn
          isGeneral: isGeneral, // Đánh dấu tin chung
          image: realImage,
          status: 'pending', // Để Admin duyệt
          time: serverTimestamp()
        });

        countAdded++;
        console.log(`💾 ĐÃ LƯU [${finalData.type}]: ${finalData.title}`);
    }

    return countAdded > 0 ? { title: `Đã cập nhật ${countAdded} tin về Cứu trợ/Cứu hộ` } : { title: "Đã quét xong." };

  } catch (error) {
    console.error("❌ Lỗi Scan:", error);
    return null;
  }
};