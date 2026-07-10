export const IMAGE_ITEMS = [
  ["hero_background", "Hero Background", "خلفية القسم الرئيسي"],
  ["home_banner_image", "Homepage Banner", "البنر أسفل بطاقات السنوات"],
  ["result_card_image", "Result Card Banner", "البنر داخل بطاقة النتيجة"],
  ["footer_banner", "Footer Banner", "صورة خلفية الفوتر"],
  ["developer_avatar", "Developer Avatar", "صورة المطور"],
  ["developer_background", "Developer Background", "خلفية مودال المطور"],
  ["logo", "Logo", "شعار المنصة"],
  ["favicon", "Favicon", "أيقونة الموقع"],
].map(([key, title, description]) => ({ key, title, description, type: "image" }));

export const DEVELOPER_FIELDS = [
  ["developer_name", "Developer Name", "text"],
  ["developer_job_title", "Job Title", "text"],
  ["developer_description", "Description", "textarea"],
  ["developer_whatsapp", "WhatsApp Link", "url"],
  ["developer_facebook", "Facebook Link", "url"],
  ["developer_telegram", "Telegram Link", "url"],
  ["developer_website", "Website Link", "url"],
  ["developer_email", "Email", "email"],
  ["developer_support_message", "Support Message", "textarea"],
].map(([key, title, type]) => ({ key, title, type }));

export const BANNER_ITEMS = IMAGE_ITEMS.filter((item) =>
  ["home_banner_image", "result_card_image"].includes(item.key),
);
