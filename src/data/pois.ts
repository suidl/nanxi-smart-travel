import type { Poi } from '../domain/types'

const PLAN_SOURCE = 'https://www.yj.gov.cn/module/download/downfile.jsp?classid=0&filename=5eedb8e860c24a0c964c41b82a33af3f.pdf'
const CULTURE_SOURCE = 'https://dj.yj.gov.cn/art/2019/12/13/art_1324930_41000511.html'
const GREENWAY_SOURCE = 'https://wm.yj.gov.cn/art/2024/4/16/art_1352397_58715563.html'
const SPRING_SOURCE = 'https://wl.wenzhou.gov.cn/art/2023/3/6/art_1642046_58903298.html'

type PoiSeed = Omit<Poi, 'durationMinutes' | 'costPerPerson' | 'openingHours' | 'seniorFriendly' | 'childFriendly' | 'sourceUrl' | 'sourceUpdatedAt'> & Partial<Pick<Poi, 'durationMinutes' | 'costPerPerson' | 'openingHours' | 'seniorFriendly' | 'childFriendly' | 'sourceUrl' | 'sourceUpdatedAt'>>

function poi(seed: PoiSeed): Poi {
  return {
    durationMinutes: 90,
    costPerPerson: null,
    openingHours: null,
    seniorFriendly: seed.walkingLevel === 'low',
    childFriendly: true,
    sourceUrl: PLAN_SOURCE,
    sourceUpdatedAt: '2025-01-09',
    ...seed,
  }
}

export const POIS: Poi[] = [
  poi({ id: 'wenzhou-south', name: '温州南站', category: 'transport', latitude: 27.967, longitude: 120.586, durationMinutes: 0, walkingLevel: 'low', weatherSuitability: 'all-weather', seniorFriendly: true, tags: ['交通', '高铁'], description: '常用入境交通节点。' }),
  poi({ id: 'yongjia-station', name: '永嘉站', category: 'transport', latitude: 28.074, longitude: 120.69, durationMinutes: 0, walkingLevel: 'low', weatherSuitability: 'all-weather', seniorFriendly: true, tags: ['交通', '动车'], description: '永嘉县铁路交通节点。' }),
  poi({ id: 'shiwaiyan', name: '石桅岩', category: 'scenery', latitude: 28.391, longitude: 120.783, durationMinutes: 150, costPerPerson: 40, openingHours: '08:00-17:00', walkingLevel: 'medium', weatherSuitability: 'outdoor', seniorFriendly: false, tags: ['山水', '奇岩'], description: '楠溪江山水游代表点位，火山岩地貌突出。' }),
  poi({ id: 'longwantan', name: '龙湾潭', category: 'scenery', latitude: 28.382, longitude: 120.703, durationMinutes: 180, costPerPerson: 55, openingHours: '08:00-16:30', walkingLevel: 'high', weatherSuitability: 'outdoor', seniorFriendly: false, tags: ['山水', '森林', '瀑布'], description: '以森林、瀑布和峡谷景观见长。' }),
  poi({ id: 'yaxiaku', name: '崖下库', category: 'scenery', latitude: 28.249, longitude: 120.638, durationMinutes: 150, costPerPerson: 35, openingHours: '08:00-16:30', walkingLevel: 'high', weatherSuitability: 'outdoor', seniorFriendly: false, tags: ['山水', '峡谷'], description: '大若岩片区山水游点位。' }),
  poi({ id: 'shierfeng', name: '十二峰', category: 'scenery', latitude: 28.256, longitude: 120.651, durationMinutes: 120, openingHours: '08:00-17:00', walkingLevel: 'high', weatherSuitability: 'outdoor', seniorFriendly: false, tags: ['山水', '登山'], description: '峰群景观，适合体力较好的游客。' }),
  poi({ id: 'taogongdong', name: '陶公洞', category: 'culture', latitude: 28.249, longitude: 120.662, durationMinutes: 60, costPerPerson: 10, openingHours: '08:00-17:00', walkingLevel: 'low', weatherSuitability: 'indoor', seniorFriendly: true, tags: ['文化', '人文', '雨天'], description: '大若岩文化点位，可作为雨天替代体验。' }),
  poi({ id: 'shiziyan', name: '狮子岩', category: 'scenery', latitude: 28.312, longitude: 120.679, durationMinutes: 90, costPerPerson: 20, openingHours: '08:00-17:30', walkingLevel: 'low', weatherSuitability: 'outdoor', seniorFriendly: true, tags: ['山水', '亲水'], description: '楠溪江中游代表性山水点位。', sourceUrl: GREENWAY_SOURCE, sourceUpdatedAt: '2024-04-16' }),
  poi({ id: 'lishui', name: '丽水古街', category: 'culture', latitude: 28.322, longitude: 120.695, durationMinutes: 90, costPerPerson: 15, openingHours: '08:00-20:00', walkingLevel: 'low', weatherSuitability: 'all-weather', seniorFriendly: true, tags: ['古村', '文化', '昆曲', '美食'], description: '岩头历史文化街区，适合古村与非遗体验。', sourceUrl: 'https://wm.yj.gov.cn/art/2020/4/13/art_1352398_42561609.html', sourceUpdatedAt: '2020-04-13' }),
  poi({ id: 'furong', name: '芙蓉古村', category: 'village', latitude: 28.319, longitude: 120.703, durationMinutes: 100, costPerPerson: 20, openingHours: '08:00-17:30', walkingLevel: 'low', weatherSuitability: 'all-weather', seniorFriendly: true, tags: ['古村', '文化', '研学'], description: '千年古村，呈现耕读文化与楠溪江村寨建筑。', sourceUrl: 'https://wm.yj.gov.cn/col/col1352398/art/2026/art_68a6bd9e00f44fb385acfd2f750d8e65.html', sourceUpdatedAt: '2026-04-03' }),
  poi({ id: 'cangpo', name: '苍坡古村', category: 'village', latitude: 28.337, longitude: 120.692, durationMinutes: 90, costPerPerson: 10, openingHours: '08:00-17:30', walkingLevel: 'low', weatherSuitability: 'all-weather', seniorFriendly: true, tags: ['古村', '文化', '宋韵'], description: '以文房四宝格局与耕读文化著称。', sourceUrl: SPRING_SOURCE, sourceUpdatedAt: '2023-03-06' }),
  poi({ id: 'linkeng', name: '林坑古村', category: 'village', latitude: 28.535, longitude: 120.601, durationMinutes: 120, walkingLevel: 'medium', weatherSuitability: 'all-weather', seniorFriendly: false, tags: ['古村', '晒秋', '摄影'], description: '楠溪江上游古村与季节性晒秋体验。' }),
  poi({ id: 'daitou', name: '埭头古村', category: 'village', latitude: 28.205, longitude: 120.619, durationMinutes: 90, walkingLevel: 'low', weatherSuitability: 'all-weather', seniorFriendly: true, tags: ['古村', '文化'], description: '永嘉古村游线路点位。' }),
  poi({ id: 'daroyan', name: '大若岩', category: 'scenery', latitude: 28.249, longitude: 120.654, durationMinutes: 120, walkingLevel: 'medium', weatherSuitability: 'outdoor', seniorFriendly: false, tags: ['山水', '文化'], description: '楠溪江七大景区之一，串联多处山水人文点位。', sourceUrl: CULTURE_SOURCE, sourceUpdatedAt: '2019-12-13' }),
  poi({ id: 'yongjia-academy', name: '永嘉书院', category: 'culture', latitude: 28.184, longitude: 120.631, durationMinutes: 120, costPerPerson: 35, openingHours: '08:00-17:00', walkingLevel: 'low', weatherSuitability: 'all-weather', seniorFriendly: true, tags: ['山水', '文化', '书院'], description: '融合山水、林滩与传统建筑的人文景区。', sourceUrl: SPRING_SOURCE, sourceUpdatedAt: '2023-03-06' }),
  poi({ id: 'baizhang-waterfall', name: '百丈瀑', category: 'scenery', latitude: 28.22, longitude: 120.62, durationMinutes: 120, walkingLevel: 'medium', weatherSuitability: 'outdoor', seniorFriendly: false, tags: ['山水', '瀑布'], description: '大若岩山水线路中的瀑布景观。' }),
  poi({ id: 'mingao-terraces', name: '茗岙梯田', category: 'scenery', latitude: 28.132, longitude: 120.497, durationMinutes: 120, walkingLevel: 'medium', weatherSuitability: 'outdoor', seniorFriendly: false, tags: ['田园', '摄影', '日落'], description: '永嘉田园游与农旅体验代表点位。' }),
  poi({ id: 'sihaishan', name: '四海山', category: 'scenery', latitude: 28.548, longitude: 120.526, durationMinutes: 180, walkingLevel: 'high', weatherSuitability: 'outdoor', seniorFriendly: false, tags: ['森林', '山水'], description: '楠溪江七大景区之一，适合户外游客。', sourceUrl: CULTURE_SOURCE, sourceUpdatedAt: '2019-12-13' }),
  poi({ id: 'red-army-site', name: '红十三军军部旧址', category: 'culture', latitude: 28.164, longitude: 120.69, durationMinutes: 75, openingHours: '09:00-16:30', walkingLevel: 'low', weatherSuitability: 'indoor', seniorFriendly: true, tags: ['红色', '文化', '雨天'], description: '国家级红色旅游经典景区相关教育点位。', sourceUrl: 'https://nxjlz.yj.gov.cn/art/2025/5/6/art_1229874010_58715877.html', sourceUpdatedAt: '2025-05-06' }),
  poi({ id: 'taipingyan', name: '太平岩', category: 'scenery', latitude: 28.142, longitude: 120.684, durationMinutes: 90, walkingLevel: 'low', weatherSuitability: 'outdoor', seniorFriendly: true, tags: ['山水', '亲水'], description: '楠溪江一日山水游线路点位。' }),
  poi({ id: 'yantou', name: '岩头镇', category: 'culture', latitude: 28.326, longitude: 120.69, durationMinutes: 60, walkingLevel: 'low', weatherSuitability: 'all-weather', seniorFriendly: true, tags: ['古村', '美食', '休憩'], description: '连接丽水街、芙蓉与苍坡等古村的旅游节点。' }),
  poi({ id: 'nanxi-greenway', name: '楠溪江绿道', category: 'scenery', latitude: 28.33, longitude: 120.68, durationMinutes: 90, walkingLevel: 'medium', weatherSuitability: 'outdoor', seniorFriendly: false, tags: ['骑行', '漫步', '山水'], description: '串联枫林、狮子岩和漂流码头的 12.84 公里旅游环线。', sourceUrl: GREENWAY_SOURCE, sourceUpdatedAt: '2024-04-16' }),
  poi({ id: 'wheat-cake', name: '永嘉麦饼体验', category: 'food', latitude: 28.325, longitude: 120.692, durationMinutes: 45, costPerPerson: 20, openingHours: '10:00-19:00', walkingLevel: 'low', weatherSuitability: 'indoor', seniorFriendly: true, tags: ['美食', '麦饼', '雨天'], description: '品尝永嘉传统麦饼，安排在岩头古村线路中。', sourceUrl: 'https://wm.yj.gov.cn/art/2020/4/13/art_1352398_42561609.html', sourceUpdatedAt: '2020-04-13' }),
  poi({ id: 'nanxi-noodles', name: '楠溪素面体验', category: 'food', latitude: 28.31, longitude: 120.67, durationMinutes: 45, costPerPerson: 25, openingHours: '10:00-19:00', walkingLevel: 'low', weatherSuitability: 'indoor', seniorFriendly: true, tags: ['美食', '素面', '雨天'], description: '楠溪江特色面食体验。' }),
  poi({ id: 'shagang-rice-noodle', name: '沙岗粉干体验', category: 'food', latitude: 28.28, longitude: 120.65, durationMinutes: 45, costPerPerson: 25, openingHours: '10:00-19:00', walkingLevel: 'low', weatherSuitability: 'indoor', seniorFriendly: true, tags: ['美食', '粉干', '雨天'], description: '永嘉地方米制美食体验。' }),
  poi({ id: 'yongjia-fish', name: '永嘉田鱼餐食', category: 'food', latitude: 28.32, longitude: 120.69, durationMinutes: 60, costPerPerson: 45, openingHours: '11:00-20:00', walkingLevel: 'low', weatherSuitability: 'indoor', seniorFriendly: true, tags: ['美食', '田鱼', '雨天'], description: '楠溪江地方餐饮体验。' }),
  poi({ id: 'wuniu-tea', name: '乌牛早茶文化体验', category: 'culture', latitude: 28.035, longitude: 120.79, durationMinutes: 75, costPerPerson: 30, openingHours: '09:00-17:00', walkingLevel: 'low', weatherSuitability: 'indoor', seniorFriendly: true, tags: ['文化', '茶', '雨天'], description: '永嘉特色茶文化体验。' }),
]
