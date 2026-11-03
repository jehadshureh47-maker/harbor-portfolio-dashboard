/* v44: one bank lookup for every spelling in the bounced cheque files (spacing, hamza/alef forms, taa marbuta,
   a leading "بنك"/"مصرف", known typos). Runs after the original BANK_NAME_MAP, so existing names map the same. */
const BANK_KEY_MAP = {
  'دبي الاسلامي':'DIB', 'دبي الاسلام':'DIB',
  'ابوظبي الاسلامي':'ADIB',
  'الامارات الاسلامي':'EIB',
  'ابوظبي الاول':'FAB',
  'الامارات دبي الوطني':'ENBD',
  'ابوظبي التجاري':'ADCB',
  'دبي التجاري':'CBD',
  'الشارقه الاسلامي':'SIB',
  'المشرق':'Mashreq',
  'الهلال':'Al Hilal',
  'الماريا':'Al Maryah',
  'راس الخيمه':'RAKBANK', 'راس الخمه':'RAKBANK',
  'جناتا ليمتد':'Janata Bank', 'جناتا':'Janata Bank'
};
function bankKeyAr(s){
  let k = String(s).replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim();
  k = k.replace(/^(بنك|مصرف)\s+/,'').replace(/\s+بنك\s+/,' ').replace(/^الامارا ت/,'الامارات').replace(/^الامارت/,'الامارات').replace(/ااول$/,'الاول');
  return k;
}
function normalizeBankName(name){
  if(!name) return name;
  const key = String(name).replace(/\s+/g,' ').trim();
  if(BANK_NAME_MAP[key]) return BANK_NAME_MAP[key];
  const k2 = bankKeyAr(key);
  return BANK_KEY_MAP[k2] || key;
}
