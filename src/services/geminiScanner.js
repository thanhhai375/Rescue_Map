import { addIncident, serverTimestamp, checkLinkExists } from "../config/firebaseConfig";
import { REGIONS } from "../constants/regionData";

const API_KEY = "AIzaSyDp3LDHbPbOwAvMcm0asYmEh4I6MXdMEuM";
const RSS_FEEDS = [
  "https://vnexpress.net/rss/thoi-su.rss",
  "https://tuoitre.vn/rss/thoi-su.rss",
  "https://dantri.com.vn/rss/xa-hoi.rss",
  "https://thanhnien.vn/rss/thoi-su.rss",
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

// --- CÁC HÀM TIỆN ÍCH (UTILS) ---

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm xóa dấu tiếng Việt để so sánh tên tỉnh (Ví dụ: "Bac Giang" == "Bắc Giang")
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

// Từ điển tọa độ đặc biệt (Không có trong regionData)
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

        // Lọc ngày (24h)
        const pubDate = new Date(item.pubDate);
        const isNew = (new Date() - pubDate) / (3600000) <= 24;

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

// Hàm tìm tọa độ: Ưu tiên Special -> Nominatim -> REGIONS (Local)
async function getCoordinates(query) {
  if (!query) return null;
  const cleanQuery = query.toLowerCase().trim();

  // 1. Check Từ điển đặc biệt (Biển Đông...)
  if (SPECIAL_LOCATIONS[cleanQuery]) return SPECIAL_LOCATIONS[cleanQuery];

  // 2. Gọi API OpenStreetMap (Nominatim)
  try {
    await delay(1000); // Delay tránh bị chặn
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'RescueMapApp/1.0' } });
    const data = await res.json();
    if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) { console.warn("Lỗi API Map, chuyển sang tìm Local...",e); }

  // 3. FALLBACK: Tìm trong file regionData.js (So sánh không dấu)
  const normalizedQuery = removeAccents(cleanQuery);
  const region = REGIONS.find(r => {
      const regionNameNorm = removeAccents(r.name);
      return normalizedQuery.includes(regionNameNorm) || regionNameNorm.includes(normalizedQuery);
  });

  if (region) {
      console.log(`📍 Dùng tọa độ tỉnh thành: ${region.name}`);
      return { lat: region.center[0], lng: region.center[1] };
  }

  return null;
}

// Hàm gọi AI (Đa Model: 2.0 -> 1.5)
async function callGeminiDirectly(promptText) {
  const MODELS = [ "gemini-2.5-flash","gemini-3.0","gemini-3.0-pro","gemini-2.0-flash","gemini-1.5-flash", "gemini-1.5-pro"];

  for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
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
  console.log("🚀 [System] Bắt đầu quét...");
  let countAdded = 0;

  try {
    // 1. Lấy RSS song song
    let candidates = [];
    const feedResults = await Promise.all(RSS_FEEDS.map(feed => fetchRSS(feed)));
    feedResults.forEach(items => candidates = [...candidates, ...items]);

    if (candidates.length === 0) return null;

    // 2. Lọc tin trùng
    let articles = [];
    for (const item of candidates) {
        if (articles.length >= 10) break; // Max 10 tin
        if (item.link && !(await checkLinkExists(item.link))) {
            articles.push(item);
        }
    }

    if (articles.length === 0) {
        console.log("✅ Không có tin mới.");
        return null;
    }

    console.log(`⚡ Phân tích ${articles.length} tin mới...`);

    // 3. Phân tích từng tin
    for (const article of articles) {
         await delay(2500); // Delay tránh lỗi 429

         const prompt = `
          Phân tích tin: "${article.title} - ${article.description}"

          Yêu cầu Vị Trí:
          - Nếu là "Biển Đông", "Hoàng Sa", "Trường Sa" -> Trả về chính xác cụm từ đó.
          - Nếu là đất liền -> Trả về "Xã/Huyện/Tỉnh" cụ thể nhất.
          - Phân biệt "biển động" (thời tiết) với "Biển Đông" (địa danh).

          Format JSON string:
          { "is_relevant": boolean, "title": string, "location_query": string, "type": "rescue"|"warning"|"news" }
        `;

        const aiText = await callGeminiDirectly(prompt);
        if (!aiText) continue;

        let finalData;
        try { finalData = JSON.parse(cleanJsonString(aiText)); } catch (e) {console.warn(e); continue; }

        if (!finalData.is_relevant) continue;

        // 4. Tìm tọa độ (Logic đã nâng cấp)
        const locationQuery = finalData.location_query || "";
        let lat = 10.7769, lng = 106.7009; // Default HCM

        const coords = await getCoordinates(locationQuery);
        if (coords) {
            lat = coords.lat;
            lng = coords.lng;
        } else {
            // Nếu không tìm thấy tọa độ nào cả, fallback về "Toàn Việt Nam"
            console.warn(`⚠️ Không tìm thấy vị trí: ${locationQuery}, gán về tâm VN.`);
            lat = 16.0544; lng = 108.2022;
        }

        const realImage = extractImageFromRSS(article);

        await addIncident({
          type: finalData.type || "news",
          title: finalData.title || article.title,
          description: (article.description || "").replace(/<[^>]*>?/gm, '').substring(0, 200) + "...",
          sourceLink: article.link,
          location: locationQuery || "Chưa xác định",
          lat, lng,
          image: realImage,
          status: 'pending',
          time: serverTimestamp()
        });

        countAdded++;
        console.log(`💾 ĐÃ LƯU: ${finalData.title} (${locationQuery})`);
    }

    return countAdded > 0 ? { title: `Đã thêm ${countAdded} tin mới` } : { title: "Hoàn tất." };

  } catch (error) {
    console.error("❌ Lỗi Scan:", error);
    return null;
  }
};