import { create } from "zustand";

export type LanguageCode = "en" | "lg" | "nk" | "sw" | "lu" | "ls";

interface TranslationDictionary {
  settingsHub: string;
  settingsSub: string;
  permissionsPref: string;
  identitySounds: string;
  instBinding: string;
  devicePerms: string;
  devicePermsSub: string;
  cameraInterface: string;
  cameraDesc: string;
  micAccess: string;
  micDesc: string;
  sysNotify: string;
  sysNotifyDesc: string;
  offlineCache: string;
  offlineCacheDesc: string;
  regionalPref: string;
  regionalPrefSub: string;
  interfaceLang: string;
  autoSyncCloud: string;
  autoSyncCloudSub: string;
  saveSettings: string;
  tutorVoiceSelect: string;
  tutorVoiceSelectSub: string;
  testVoiceBtn: string;
  adamsName: string;
  adamsDesc: string;
  powerName: string;
  powerDesc: string;
  synthesisAttrs: string;
  synthesisAttrsSub: string;
  speechPitch: string;
  speechPitchDesc: string;
  speechRate: string;
  speechRateDesc: string;
  saveVoiceAttrs: string;
  instConnBinding: string;
  instConnBindingSub: string;
  schoolIdLabel: string;
  schoolNameLabel: string;
  saveBindingBtn: string;
  instShareDashboard: string;
  instShareDashboardSub: string;
  inviteTemplate: string;
  copyInviteBtn: string;
  shareCsvBtn: string;
  qrBadgeTitle: string;
  noBindingTitle: string;
  noBindingDesc: string;
  regenerateSchoolId: string;
  regeneratePending: string;
  verifyProgress: string;
  adminPrivilege: string;
}

const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    settingsHub: "Settings Hub",
    settingsSub: "Configure study options, tutor identities, and institution syncing",
    permissionsPref: "Permissions & Preferences",
    identitySounds: "Identity & Sounds",
    instBinding: "Institutional Binding",
    devicePerms: "Device Permissions",
    devicePermsSub: "Control how the study portal accesses hardware features in your active session.",
    cameraInterface: "Camera Interface",
    cameraDesc: "Required for document uploads, scanning school badges, and interactive assessments.",
    micAccess: "Microphone Access",
    micDesc: "Used for speaking directly to your tutor, recording voice answers, and reading aloud.",
    sysNotify: "System Notifications",
    sysNotifyDesc: "Sends revision reminders, quiz updates, and important announcements.",
    offlineCache: "Offline Caching",
    offlineCacheDesc: "Persists textbooks, notes, and study guides in offline storage.",
    regionalPref: "Regional & Localization Preferences",
    regionalPrefSub: "Select your preferred default interface language for study topics and syllabus guides.",
    interfaceLang: "Interface Language",
    autoSyncCloud: "Auto-Sync to Cloud",
    autoSyncCloudSub: "Save self-assessments instantly when online",
    saveSettings: "Save Settings",
    tutorVoiceSelect: "Select Tutor Voice & Identity",
    tutorVoiceSelectSub: "Switch between distinct tutor profiles. Test their voice output instantly.",
    testVoiceBtn: "Test Voice",
    adamsName: "Adams (Male)",
    adamsDesc: "Pitched lower at a robust, deliberate pace. Designed for systematic explanations of curriculum logic and science exercises.",
    powerName: "Power / Haawa (Female)",
    powerDesc: "Pitched higher, carrying a supportive, modern tone. Tuned for reviewing syllabus frameworks and evaluations.",
    synthesisAttrs: "Speech Synthesis Attributes",
    synthesisAttrsSub: "Customize default speed and pitch variables for text-to-speech feedback.",
    speechPitch: "Speech Pitch Offset",
    speechPitchDesc: "Adjusts the vocal pitch of the synthesis engine.",
    speechRate: "Speech Rate (Speed Offset)",
    speechRateDesc: "Speed up or slow down verbal tutor read-aloud responses.",
    saveVoiceAttrs: "Save Voice Attributes",
    instConnBinding: "Institutional Connection & Binding",
    instConnBindingSub: "Link your account to an NCDC accredited school registry by entering their alphanumeric School ID.",
    schoolIdLabel: "School ID / Code",
    schoolNameLabel: "School / Institution Name",
    saveBindingBtn: "Save Institutional Binding",
    instShareDashboard: "Institutional Sharing Dashboard",
    instShareDashboardSub: "Deploy invite links, sync continuous files, and export physical credentials.",
    inviteTemplate: "Invite Message Template",
    copyInviteBtn: "Copy Invite Details",
    shareCsvBtn: "Share All Onboard CSV",
    qrBadgeTitle: "Branded School QR Badge",
    noBindingTitle: "No Institutional Binding Established",
    noBindingDesc: "You are exploring as an independent learner. Enter your school's code in the binder form above to generate your digital QR Badge.",
    regenerateSchoolId: "Regenerate School ID",
    regeneratePending: "Security protocol initiated. Verification pending...",
    verifyProgress: "Estimated verification time: ~4 hours (Protocol S2-NCDC)",
    adminPrivilege: "Administrative Privilege Active",
  },
  lg: {
    settingsHub: "Ebyemisinde by'Entegeka",
    settingsSub: "Kyusa mu ntegeka y'okusoma, amaloboozi ga tutor, n'okusika okuva mu ssomero",
    permissionsPref: "Okukkiriza n'Okulonda",
    identitySounds: "Obw'ennyini n'Amaloboozi",
    instBinding: "Okukwasaganya Essomero",
    devicePerms: "Okukkiriza Kwebyuma",
    devicePermsSub: "Fuga ngeri ssentero gye weyambisa ebyuma byo mu kusoma.",
    cameraInterface: "Kamera y'Essomero",
    cameraDesc: "Weetaaga okukozesa kamera mu kuteekako ebiwandiiko n'okusika bbaajis.",
    micAccess: "Okukozesa Eminda",
    micDesc: "Kikozesebwa mu kwogera butereevu ne tutor wo n'okuddamu ebibuuzo.",
    sysNotify: "Okulabula Kw'entegeka",
    sysNotifyDesc: "Kusindika kujjukiza, ebibuuzo eby'amangu n'ebirango eby'omugaso.",
    offlineCache: "Okutereka Kw'ebyuma",
    offlineCacheDesc: "Kutereka ebitabo, eby'okusoma n'emikutu nga tewali mutimbagano.",
    regionalPref: "Entegeka y'Ebyalo n'Olulimi",
    regionalPrefSub: "Londa olulimi lwo lw'oyagala okukozesa okusoma eby'okusoma n'emikutu.",
    interfaceLang: "Olulimi Lw'entegeka",
    autoSyncCloud: "Okusika mu Cloud",
    autoSyncCloudSub: "Tereka ebibuuzo byo butereevu nga oli ku mutimbagano",
    saveSettings: "Tereka Entegeka",
    tutorVoiceSelect: "Londa Iloloboozi n'Obw'ennyini bwa Tutor",
    tutorVoiceSelectSub: "Kyusa wakati w'amaloboozi ag'enjawulo ga tutor. Gezaako amaloboozi ago mbulereevu.",
    testVoiceBtn: "Gezaako Eddoboozi",
    adamsName: "Adams (Omusajja)",
    adamsDesc: "Nga eddoboozi liri wansi, nga lya nkalakkalira. Lyategekebwa okunnyonnyola ebikwata ku mikutu gwa ssaayansi.",
    powerName: "Power / Haawa (Omukazi)",
    powerDesc: "Nga eddoboozi liri waggulu, nga lya kutegeera ne mbeera ey'omulembe. Lyategekebwa okuddamu emikutu.",
    synthesisAttrs: "Entegeka y'Eddoboozi ery'Omulembe",
    synthesisAttrsSub: "Kyusa mu bipimo by'okwogera butereevu okuva mu kyuma.",
    speechPitch: "Ekipimo ky'Eddoboozi",
    speechPitchDesc: "Kyusa obugonvu n'okukakada kw'eddoboozi.",
    speechRate: "Emisinde gy'Okwogera",
    speechRateDesc: "Yongeza kana weesize emisinde gy'okwogera gwa tutor.",
    saveVoiceAttrs: "Tereka Ekipimo ky'Eddoboozi",
    instConnBinding: "Okugatta n'Okukwasaganya Essomero",
    instConnBindingSub: "Gatta akawunti yo ku ssomero erikkiriziddwa NCDC nga oyingiza namba y'Essomero.",
    schoolIdLabel: "Namba y'Essomero / Koodi",
    schoolNameLabel: "Erinnya ly'Essomero / Kituo",
    saveBindingBtn: "Tereka Okugatta ku Ssomero",
    instShareDashboard: "Akakiiko k'Okugabana k'Essomero",
    instShareDashboardSub: "Kozesa obulambike, sika ebiwandiiko eby'omugaso, era fulumya bbaajis.",
    inviteTemplate: "Omwenya gw'Okulalika",
    copyInviteBtn: "Koppa Bulambike bw'Okulalika",
    shareCsvBtn: "Gabana Onboard CSV",
    qrBadgeTitle: "Bbaajis y'Essomero eya QR",
    noBindingTitle: "Tewali Ssomero Lyagattiddwa",
    noBindingDesc: "Onoonyereza nga omuyizi ayetongodde. Yingiza koodi y'essomero waggulu okufuna QR bbaajis yo.",
    regenerateSchoolId: "Kyusa Namba y'Essomero",
    regeneratePending: "Okukyusa namba y'essomero kutandise. Okukakasa kulindiriddwa...",
    verifyProgress: "Ekiseera eky'okukakasa: ~Esawa 4 (Entegeka S2-NCDC)",
    adminPrivilege: "Okulonda kw'Omukulu w'Essomero Kuli Ku",
  },
  nk: {
    settingsHub: "Eby'Okutebeja Obusinge",
    settingsSub: "Teebeja okushoma kwawe, amaraka ga tutor, n'okukwasana n'eishomero ryawe",
    permissionsPref: "Okwikiriza n'Eby'okuronda",
    identitySounds: "Obumanyiso n'Amaraka",
    instBinding: "Okukwasana n'Eishomero",
    devicePerms: "Okwikiriza kw'Ebyuma",
    devicePermsSub: "Fuga oku ekyuma kyawe kirakozese ebirungi by'okushoma ku mutimbagano.",
    cameraInterface: "Kamera y'Eishomero",
    cameraDesc: "Nyakwetengwa okutaho ebihandiiko n'okushika bbaajis yawe.",
    micAccess: "Eminda y'okwogera",
    micDesc: "Kikozesebwa mu kwogera butereevu na tutor waawe n'okushoma.",
    sysNotify: "Okuteberezebwa",
    sysNotifyDesc: "Kutuma okwijukizibwa, ebibuuzo n'ebirango by'omugaso.",
    offlineCache: "Okubiika kw'Ebyuma",
    offlineCacheDesc: "Kubiika ebitabo by'okushoma n'ebihandiiko eby'okusoma tewali mutimbagano.",
    regionalPref: "Okutebeja kw'Ebyalo n'Orulimi",
    regionalPrefSub: "Ronda orulimi rw'oyagala okukozesa ku mutimbagano n'okushoma.",
    interfaceLang: "Orulimi rw'Embeera",
    autoSyncCloud: "Okusika mu Cloud",
    autoSyncCloudSub: "Biika ebibuuzo byawe butereevu ku mutimbagano",
    saveSettings: "Biika Okutebeja",
    tutorVoiceSelect: "Ronda Eraka n'Obumanyiso bwa Tutor",
    tutorVoiceSelectSub: "Kyusa wakati w'amaraka ag'enjawulo ga tutor. Gezaako amaraka butereevu.",
    testVoiceBtn: "Gezaako Eraka",
    adamsName: "Adams (Omushaija)",
    adamsDesc: "Nga eraka riri hansi, ryatebejekwa okunshonshorera eby'esomomo rya ssaayansi.",
    powerName: "Power / Haawa (Omukazi)",
    powerDesc: "Nga eraka riri buggya, rya kutegeera kw'omulembe. Ryatebejekwa okugarukamu.",
    synthesisAttrs: "Okutebeja kw'Eraka ry'Omulembe",
    synthesisAttrsSub: "Kyusa mu bipimo by'okwogera butereevu okuva mu kyuma.",
    speechPitch: "Ekipimo kw'Eraka",
    speechPitchDesc: "Kyusa obugonvu bw'eraka ryawe.",
    speechRate: "Emisinde gy'Okwogera",
    speechRateDesc: "Yongera emisinde y'okwogera kwa tutor waawe.",
    saveVoiceAttrs: "Biika Ekipimo kw'Eraka",
    instConnBinding: "Okugatta n'Okukwasana n'Eishomero",
    instConnBindingSub: "Gatta akawunti yawe ku ishomero erikirizibwe NCDC oyingize namba y'eishomero.",
    schoolIdLabel: "Namba y'Eishomero / Koodi",
    schoolNameLabel: "Eina ry'Eishomero / Kituo",
    saveBindingBtn: "Biika Okugatta kuishomero",
    instShareDashboard: "Akakiiko k'Okugabana k'Eishomero",
    instShareDashboardSub: "Kozesa obulambike n'ebihandiiko by'eishomero.",
    inviteTemplate: "Ekiteberezebwa ky'Okurarika",
    copyInviteBtn: "Koppa Bulambike bw'Okurarika",
    shareCsvBtn: "Gabana Onboard CSV",
    qrBadgeTitle: "Bbaajis y'Eishomero eya QR",
    noBindingTitle: "Tihariho Ishomero Ryagattiddwa",
    noBindingDesc: "Onoonyereza nga omushomi oyetongodde. Yingiza koodi y'ishomero waggulu okufuna QR bbaajis yawe.",
    regenerateSchoolId: "Kyusa Namba y'Eishomero",
    regeneratePending: "Okukyusa kutandise. Okukakasa kurindiriddwa...",
    verifyProgress: "Ekiseera eky'okukakasa: ~Esawa 4 (Entegeka S2-NCDC)",
    adminPrivilege: "Okuronda kw'Omukulu w'Eishomero Kuli Ku",
  },
  sw: {
    settingsHub: "Vipangilio vya Mfumo",
    settingsSub: "Sanidi chaguzi za masomo, sauti za mkufunzi, na maingiliano ya shule",
    permissionsPref: "Ruhusa & Mapendeleo",
    identitySounds: "Sauti & Utambulisho",
    instBinding: "Muunganisho wa Shule",
    devicePerms: "Ruhusa za Vifaa",
    devicePermsSub: "Dhibiti jinsi tovuti inavyofikia vifaa vyako wakati wa masomo.",
    cameraInterface: "Kiolesura cha Kamera",
    cameraDesc: "Inahitajika kwa ajili ya kupakia nyaraka, kusoma beji za shule, na tathmini.",
    micAccess: "Ruhusa ya Maikrofoni",
    micDesc: "Inatumika kuongea moja kwa moja na mkufunzi, kurekodi majibu ya sauti na kusoma.",
    sysNotify: "Arifa za Mfumo",
    sysNotifyDesc: "Inatuma vikumbusho vya masahihisho, sasisho za chemsha bongo na matangazo.",
    offlineCache: "Uhifadhi wa Nje ya Mtandao",
    offlineCacheDesc: "Inahifadhi vitabu, maelezo, na miongozo ya masomo kwenye kifaa chako.",
    regionalPref: "Mapendeleo ya Kikanda & Lugha",
    regionalPrefSub: "Chagua lugha unayopendelea kwa mada za masomo na miongozo ya mtaala.",
    interfaceLang: "Lugha ya Programu",
    autoSyncCloud: "Kusawazisha Kiotomatiki na Cloud",
    autoSyncCloudSub: "Hifadhi tathmini zako mara moja ukiwa mtandaoni",
    saveSettings: "Hifadhi Vipangilio",
    tutorVoiceSelect: "Chagua Sauti & Utambulisho wa Mkufunzi",
    tutorVoiceSelectSub: "Badilisha wasifu wa wakufunzi. Jaribu sauti zao mara moja.",
    testVoiceBtn: "Jaribu Sauti",
    adamsName: "Adams (Kiume)",
    adamsDesc: "Sauti nzito yenye mwendo wa utulivu. Inafaa kwa maelezo ya kina ya sayansi na mantiki ya mtaala.",
    powerName: "Power / Haawa (Kike)",
    powerDesc: "Sauti ya juu, yenye sauti ya kisasa na inayofariji. Inafaa kwa kupitia miongozo ya mtaala.",
    synthesisAttrs: "Tabia za Sauti za Kidijiti",
    synthesisAttrsSub: "Badilisha kasi na sauti kwa ajili ya usomaji wa kiotomatiki.",
    speechPitch: "Kiwango cha Sauti",
    speechPitchDesc: "Inarekebisha unene au wembamba wa sauti.",
    speechRate: "Kasi ya Kuzungumza",
    speechRateDesc: "Ongeza au punguza kasi ya usomaji vya mkufunzi.",
    saveVoiceAttrs: "Hifadhi Tabia za Sauti",
    instConnBinding: "Muunganisho na Usajili wa Shule",
    instConnBindingSub: "Unganisha akaunti yako na shule iliyosajiliwa na NCDC kwa kuingiza Msimbo wa Shule.",
    schoolIdLabel: "Msimbo / ID ya Shule",
    schoolNameLabel: "Jina la Shule / Kituo",
    saveBindingBtn: "Hifadhi Muunganisho wa Shule",
    instShareDashboard: "Sehemu ya Kushiriki ya Shule",
    instShareDashboardSub: "Tuma viungo vya mwaliko, sawazisha faili, na uandikishe beji ya kidijiti.",
    inviteTemplate: "Mwaliko wa Kujiunga",
    copyInviteBtn: "Nakili Maelezo ya Mwaliko",
    shareCsvBtn: "Shiriki CSV ya Kusajili",
    qrBadgeTitle: "Beji ya Shule yenye QR",
    noBindingTitle: "Hakuna Shule Iliyounganishwa",
    noBindingDesc: "Unasoma kama mwanafunzi huru. Weka msimbo wa shule yako hapo juu ili kupata beji ya QR.",
    regenerateSchoolId: "Tengeneza Upya ID ya Shule",
    regeneratePending: "Itifaki ya usalama imeanzishwa. Uhakiki unasubiriwa...",
    verifyProgress: "Kadirio la muda wa uhakiki: ~Saa 4 (Itifaki S2-NCDC)",
    adminPrivilege: "Ruhusa ya Msimamizi Ipo Wazi",
  },
  lu: {
    settingsHub: "Chengo mar Chike",
    settingsSub: "Los chengo mar somo, dwol mar japuonj, kod lero mar skul margi",
    permissionsPref: "Yie kod Gik midwaro",
    identitySounds: "Dwol kod Kido",
    instBinding: "Tudo kuom Skul",
    devicePerms: "Yie mar Gige somo",
    devicePermsSub: "Riti kaka somo weyo gige somo tiyo e somo mari.",
    cameraInterface: "Kamera mar Skul",
    cameraDesc: "Dwarore kuom kiting'o nyaraka, ng'iyo bbaajis mar skul, kod ratiro.",
    micAccess: "Maikrofoni kuom Wuoyo",
    micDesc: "Tiyo kuom wuoyo butereevu kod japuonj, ningo dwol kod somo.",
    sysNotify: "Milome mar Chengo",
    sysNotifyDesc: "Oro parruok mar somo, penjo mapiyo kod lero madwarore.",
    offlineCache: "Kano mar Gige tiyo",
    offlineCacheDesc: "Kano buge somo, weche somo kod chengo somo e gige kano tewali mtandao.",
    regionalPref: "Dhok kod Gik madwarore",
    regionalPrefSub: "Yier dhok midwaro kuom weche somo kod weche syllabus.",
    interfaceLang: "Dhok mar Chengo",
    autoSyncCloud: "Kano piny butereevu",
    autoSyncCloudSub: "Kano ratiro mari mapiyo ka idhi e mtandao",
    saveSettings: "Kano Chengo",
    tutorVoiceSelect: "Yier Dwol kod Kido mar Japuonj",
    tutorVoiceSelectSub: "Lok e kind dwol mar japuonj mopogore. Tem dwol margi mapiyo.",
    testVoiceBtn: "Tem Dwol",
    adamsName: "Adams (Dichuo)",
    adamsDesc: "Dwol mapiny maber, momako chengo. Olosne lero weche moko mag sayans kod syllabus.",
    powerName: "Power / Haawa (Dhako)",
    powerDesc: "Dwol mamalo, moketo kido manyien. Olosne ng'iyo weche syllabus kod penjo.",
    synthesisAttrs: "Kido mar Dwol mar Kompyuta",
    synthesisAttrsSub: "Lok speed kod pitch mar somo mag dwol.",
    speechPitch: "Longo mar Dwol",
    speechPitchDesc: "Ywayo dwol mondo obed mamalo kata mapiny.",
    speechRate: "Speed mar Wuoyo",
    speechRateDesc: "Yor speed kata lok piny speed mar wuoyo mar japuonj.",
    saveVoiceAttrs: "Kano Kido mar Dwol",
    instConnBinding: "Tudo kod Namba mar Skul",
    instConnBindingSub: "Tud akawunt mari kod skul moko moket gi NCDC koingo Namba mar Skul.",
    schoolIdLabel: "Namba mar Skul / Code",
    schoolNameLabel: "Nying mar Skul / Center",
    saveBindingBtn: "Kano Tudo mar Skul",
    instShareDashboard: "Milo mar Share mar Skul",
    instShareDashboardSub: "Oro link mar lwelu, kano fail mag skul, kod gige bbaajis.",
    inviteTemplate: "Weche mar Lwelu",
    copyInviteBtn: "Koppi Weche mar Lwelu",
    shareCsvBtn: "Share Onboard CSV",
    qrBadgeTitle: "Bbaajis mar Skul mar QR",
    noBindingTitle: "Onge Skul Motudere",
    noBindingDesc: "Isomo kaka ng'at ma oyetongore. Ket code mar skul mari malo kae mondo iyier QR bbaajis mari.",
    regenerateSchoolId: "Yier Namba Manyien mar Skul",
    regeneratePending: "Ratiro mar ritruok ochakore. Ng'iyo piny pod ritore...",
    verifyProgress: "Kadirio mar saawa mag ratiro: ~Saawa 4 (Itifaki S2-NCDC)",
    adminPrivilege: "Yie mar Ruoth mar Skul Otiyore",
  },
  ls: {
    settingsHub: "Ebisito by'Entegeka y'Okusoma",
    settingsSub: "Tegeka emisinde gy'okusoma, amaloboozi ga tutor, n'okusika emiwendo gya ssomero lyo",
    permissionsPref: "Okukkiriza n'Eby'okulonda",
    identitySounds: "Obuntu n'Amaloboozi",
    instBinding: "Okusiba ku Ssomero Lyo",
    devicePerms: "Ebisito by'Okukkiriza Ebyuma",
    devicePermsSub: "Fuga ngeri ssentero gye weyambisaamu ebyuma byo mu ntegeka y'okusoma.",
    cameraInterface: "Kamera y'Okusoma",
    cameraDesc: "Kyetagiisa okukozesa kamera mu kuteekako ebiwandiiko n'okusika obulambe.",
    micAccess: "Okukozesa Eminda y'Akwogera",
    micDesc: "Kikozesebwa okwogera butereevu ne tutor wo n'okuddamu ebibuuzo mu ddoboozi.",
    sysNotify: "Okulabula kw'Entegeka",
    sysNotifyDesc: "Kusindika kujjukiza, ebibuuzo n'ebirango eby'omugaso mu kusoma.",
    offlineCache: "Okutereka ku Kyuma Kyokka",
    offlineCacheDesc: "Kutereka ebitabo n'ebisomwa ku kyuma kyo n'okusomera ku lwa wecca nga tewali mutimbagano.",
    regionalPref: "Entegeka y'Ebyalo n'Olulimi",
    regionalPrefSub: "Londa olulimi lw'oyagala okukozesa okusoma ebisomwa n'emikutu gya syllabus.",
    interfaceLang: "Olulimi lw'Entegeka",
    autoSyncCloud: "Okusika mu Cloud ku Lwokka",
    autoSyncCloudSub: "Tereka ebibuuzo n'ebitabo butereevu nga oli ku mutimbagano",
    saveSettings: "Tereka Entegeka",
    tutorVoiceSelect: "Londa Eddoboozi n'Obuntu bwa Tutor",
    tutorVoiceSelectSub: "Kyusa wakati w'amaloboozi ag'enjawulo ga tutor. Gezaako amaloboozi ago mbulereevu.",
    testVoiceBtn: "Gezaako Eddoboozi",
    adamsName: "Adams (Omusajja)",
    adamsDesc: "Nga eddoboozi liri wansi, nga lya nkalakkalira. Lyategekebwa okunnyonnyola ebikwata ku mikutu gwa ssaayansi ne syllabus.",
    powerName: "Power / Haawa (Omukazi)",
    powerDesc: "Nga eddoboozi liri waggulu, nga lya kutegeera ne mbeera ey'omulembe. Lyategekebwa okuddamu.",
    synthesisAttrs: "Ebisito by'Eddoboozi ery'Omulembe",
    synthesisAttrsSub: "Kyusa mu bipimo by'okwogera butereevu n'emisinde gy'eddoboozi.",
    speechPitch: "Ekipimo ky'Eddoboozi",
    speechPitchDesc: "Kyusa obugonvu n'okukakada kw'eddoboozi.",
    speechRate: "Emisinde gy'Okwogera",
    speechRateDesc: "Yongeza kaba weesize emisinde gy'okwogera gwa tutor wo.",
    saveVoiceAttrs: "Tereka Ekipimo ky'Eddoboozi",
    instConnBinding: "Okusiba n'Okugatta ku Ssomero",
    instConnBindingSub: "Gatta akawunti yo ku ssomero erikkiriziddwa NCDC nga oyingiza namba y'Essomero lyo.",
    schoolIdLabel: "Namba y'Essomero / Koodi",
    schoolNameLabel: "Erinnya ly'Essomero / Kituo",
    saveBindingBtn: "Tereka Okusiba ku Ssomero",
    instShareDashboard: "Akakiiko k'Okugabana k'Essomero",
    instShareDashboardSub: "Kozesa obulambike, sika ebiwandiiko eby'omugaso, era fulumya bbaajis.",
    inviteTemplate: "Omwenya gw'Okulalika",
    copyInviteBtn: "Koppa Bulambike bw'Okulalika",
    shareCsvBtn: "Gabana Onboard CSV",
    qrBadgeTitle: "Bbaajis y'Essomero eya QR",
    noBindingTitle: "Tewali Ssomero Lyagattiddwa",
    noBindingDesc: "Onoonyereza nga omuyizi ayetongodde. Yingiza koodi y'essomero waggulu okufuna QR bbaajis yo.",
    regenerateSchoolId: "Kyusa Namba y'Essomero",
    regeneratePending: "Okukyusa kutandise mu mbeera y'obukuumi. Okukakasa kulindiriddwa...",
    verifyProgress: "Ekiseera eky'okukakasa: ~Esawa 4 (Protocol S2-NCDC)",
    adminPrivilege: "Okulonda kw'Omukulu w'Essomero Kuli Ku",
  },
};

interface LanguageStore {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
}

export const useLanguageStore = create<LanguageStore>((set) => {
  // Initialize from localStorage or default to english
  const savedLang = (typeof window !== "undefined" ? localStorage.getItem("app_lang") : "en") as LanguageCode;
  const initialLang = (["en", "lg", "nk", "sw", "lu", "ls"].includes(savedLang) ? savedLang : "en") as LanguageCode;

  return {
    language: initialLang,
    t: translations[initialLang],
    setLanguage: (lang) => {
      localStorage.setItem("app_lang", lang);
      set({ language: lang, t: translations[lang] });
    },
  };
});
