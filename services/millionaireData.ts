
export interface MillionaireQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * بنك الأسئلة المطور (نسخة الرقة الغربية - برو):
 * 1. لا يحتوي على أي أسئلة دينية إطلاقاً.
 * 2. الأسئلة السهلة هي ثقافة عامة جادة (تاريخ، جغرافيا، علوم، رياضة).
 */
export const QUESTION_BANK: MillionaireQuestion[] = [
  // --- EASY (Tier 1 - First 5 Questions) ---
  { question: "ما هو الكوكب الملقب بالكوكب الأحمر؟", options: ["الزهرة", "المريخ", "المشتري", "زحل"], correctIndex: 1, difficulty: 'easy' },
  { question: "ما هي عاصمة اليابان؟", options: ["بكين", "سيول", "طوكيو", "بانكوك"], correctIndex: 2, difficulty: 'easy' },
  { question: "كم عدد قارات العالم؟", options: ["5 قارات", "6 قارات", "7 قارات", "8 قارات"], correctIndex: 2, difficulty: 'easy' },
  { question: "ما هو العنصر الكيميائي الذي يمثله الرمز (Fe)؟", options: ["الذهب", "الفضة", "الحديد", "النحاس"], correctIndex: 2, difficulty: 'easy' },
  { question: "من هو الرسام صاحب لوحة 'الموناليزا'؟", options: ["فان جوخ", "بيكاسو", "ليوناردو دافنشي", "مايكل أنجلو"], correctIndex: 2, difficulty: 'easy' },
  { question: "ما هو أسرع حيوان بري في العالم؟", options: ["الأسد", "الفهد الصياد", "النمر", "الحصان"], correctIndex: 1, difficulty: 'easy' },
  { question: "في أي قارة تقع دولة البرازيل؟", options: ["أفريقيا", "أمريكا الشمالية", "أمريكا الجنوبية", "آسيا"], correctIndex: 2, difficulty: 'easy' },
  { question: "ما هو أطول نهر في العالم؟", options: ["نهر النيل", "نهر الأمازون", "نهر الميسيسيبي", "نهر الدانوب"], correctIndex: 0, difficulty: 'easy' },

  // --- MEDIUM (Tier 2 - Questions 6 to 10) ---
  { question: "من هو مخترع المصباح الكهربائي؟", options: ["ألكسندر بيل", "إسحاق نيوتن", "توماس إديسون", "نيكولا تسلا"], correctIndex: 2, difficulty: 'medium' },
  { question: "ما هو أعمق محيط في العالم؟", options: ["المحيط الأطلسي", "المحيط الهندي", "المحيط الهادئ", "المحيط المتجمد"], correctIndex: 2, difficulty: 'medium' },
  { question: "من هي أول امرأة تحصل على جائزة نوبل؟", options: ["ماري كوري", "الأم تيريزا", "ملالا يوسفزي", "إنديرا غاندي"], correctIndex: 0, difficulty: 'medium' },
  { question: "في أي عام سقط جدار برلين؟", options: ["1987", "1989", "1991", "1993"], correctIndex: 1, difficulty: 'medium' },
  { question: "ما هي أصغر دولة في العالم من حيث المساحة؟", options: ["موناكو", "سان مارينو", "الفاتيكان", "مالطا"], correctIndex: 2, difficulty: 'medium' },
  { question: "ما هو الغاز الذي يشكل النسبة الأكبر من الغلاف الجوي؟", options: ["الأكسجين", "النيتروجين", "الهيدروجين", "ثاني أكسيد الكربون"], correctIndex: 1, difficulty: 'medium' },

  // --- HARD (Tier 3 - Questions 11 to 15) ---
  { question: "ما هو العلم الذي يدرس تصنيف الكائنات الحية؟", options: ["الجيولوجيا", "التاكسونومي", "الأنثروبولوجيا", "السوسيولوجيا"], correctIndex: 1, difficulty: 'hard' },
  { question: "كم عدد عظام جسم الإنسان البالغ؟", options: ["200 عظمة", "206 عظمة", "212 عظمة", "218 عظمة"], correctIndex: 1, difficulty: 'hard' },
  { question: "ما هو الرمز الكيميائي لعنصر الفضة؟", options: ["Au", "Ag", "Pb", "Sn"], correctIndex: 1, difficulty: 'hard' },
  { question: "من هو الفيلسوف الذي ألف كتاب 'الجمهورية'؟", options: ["أرسطو", "سقراط", "أفلاطون", "ديكارت"], correctIndex: 2, difficulty: 'hard' },
  { question: "ما هو أبعد كوكب عن الشمس في نظامنا الشمسي؟", options: ["زحل", "أورانوس", "نبتون", "بلوتو"], correctIndex: 2, difficulty: 'hard' },
];

export const getSessionQuestions = () => {
  // اختيار تدرج منطقي للصعوبة لضمان تجربة حقيقية
  const easy = QUESTION_BANK.filter(q => q.difficulty === 'easy').sort(() => Math.random() - 0.5).slice(0, 5);
  const medium = QUESTION_BANK.filter(q => q.difficulty === 'medium').sort(() => Math.random() - 0.5).slice(0, 5);
  const hard = QUESTION_BANK.filter(q => q.difficulty === 'hard').sort(() => Math.random() - 0.5).slice(0, 5);
  
  return [...easy, ...medium, ...hard];
};
