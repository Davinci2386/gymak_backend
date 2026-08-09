const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const COLORS = {
  bg: '#F7F9FC', ink: '#182230', muted: '#5D6B7A', line: '#8291A3', white: '#FFFFFF',
  navy: '#173B57', blue: '#2F6FED', cyan: '#DDF4FF', green: '#1B8A5A', greenBg: '#E8F7F0',
  orange: '#C56A13', orangeBg: '#FFF1DF', purple: '#7454C7', purpleBg: '#F0EBFF',
  red: '#B64747', redBg: '#FDEBEC', grayBg: '#EEF2F6', gold: '#9A6B00', goldBg: '#FFF6D8',
};

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attrs = (obj) => Object.entries(obj).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
const rect = (x, y, w, h, fill, stroke = 'none', rx = 18, extra = {}) => `<rect ${attrs({ x, y, width: w, height: h, rx, fill, stroke, ...extra })}/>`;
const line = (x1, y1, x2, y2, stroke = COLORS.line, width = 3, extra = {}) => `<line ${attrs({ x1, y1, x2, y2, stroke, 'stroke-width': width, ...extra })}/>`;
const pathEl = (d, stroke = COLORS.line, width = 3, extra = {}) => `<path ${attrs({ d, fill: 'none', stroke, 'stroke-width': width, ...extra })}/>`;
const text = (x, y, value, size = 24, fill = COLORS.ink, weight = 400, anchor = 'start', family = 'Segoe UI, Arial, sans-serif', extra = {}) =>
  `<text ${attrs({ x, y, 'font-size': size, fill, 'font-weight': weight, 'text-anchor': anchor, 'font-family': family, ...extra })}>${esc(value)}</text>`;

function svgDoc(w, h, body, title, desc) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<title>${esc(title)}</title><desc>${esc(desc)}</desc>
<defs>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#1B2A3A" flood-opacity="0.12"/></filter>
  <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 Z" fill="#8291A3"/></marker>
  <marker id="openArrow" markerWidth="14" markerHeight="14" refX="12" refY="7" orient="auto"><path d="M1,1 L12,7 L1,13" fill="none" stroke="#8291A3" stroke-width="2"/></marker>
  <style>text { dominant-baseline: alphabetic; } .mono { font-family: 'Cascadia Mono','Consolas',monospace; }</style>
</defs>
${body}
</svg>`;
}

function pageHeader(w, titleText, subtitle, badge) {
  return [
    rect(0, 0, w, 190, COLORS.navy, 'none', 0),
    text(90, 82, titleText, 46, COLORS.white, 700),
    text(90, 137, subtitle, 25, '#D9E6EF', 400),
    rect(w - 700, 55, 610, 76, '#244D6B', '#4B708A', 16, { 'stroke-width': 2 }),
    text(w - 395, 103, badge, 24, '#EAF4FB', 600, 'middle'),
  ].join('');
}

function packageBox(x, y, w, h, titleText, color, subtitle = '') {
  return [
    rect(x, y, w, h, COLORS.white, '#CAD4DF', 24, { 'stroke-width': 3, filter: 'url(#shadow)' }),
    rect(x, y, w, 82, color, color, 24),
    rect(x, y + 54, w, 28, color, color, 0),
    text(x + 34, y + 52, titleText, 29, COLORS.white, 700),
    subtitle ? text(x + w - 30, y + 50, subtitle, 19, '#EEF7FF', 500, 'end') : '',
  ].join('');
}

function umlCard({ x, y, w, title: titleText, stereotype = 'service', ops = [], color = COLORS.blue, note = '' }) {
  const headerH = 96;
  const opH = 38;
  const h = headerH + 32 + ops.length * opH + (note ? 54 : 12);
  let out = rect(x, y, w, h, COLORS.white, '#B8C5D1', 14, { 'stroke-width': 2, filter: 'url(#shadow)' });
  out += rect(x, y, w, headerH, color, color, 14);
  out += rect(x, y + 70, w, 26, color, color, 0);
  out += text(x + w / 2, y + 30, `«${stereotype}»`, 18, '#EAF2FF', 500, 'middle');
  out += text(x + w / 2, y + 68, titleText, 25, COLORS.white, 700, 'middle');
  out += line(x, y + headerH, x + w, y + headerH, '#B8C5D1', 2);
  ops.forEach((op, i) => { out += text(x + 24, y + headerH + 38 + i * opH, `+ ${op}()`, 20, COLORS.ink, 500, 'start', 'Cascadia Mono, Consolas, monospace'); });
  if (note) out += text(x + 24, y + h - 22, note, 17, COLORS.muted, 400);
  return { svg: out, x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

function dependency(a, b, label = '', color = COLORS.line, bend = 0) {
  const sx = a.cx, sy = a.y + a.h, tx = b.cx, ty = b.y;
  const mid = (sy + ty) / 2 + bend;
  let out = pathEl(`M ${sx} ${sy} V ${mid} H ${tx} V ${ty}`, color, 3, { 'stroke-dasharray': '12 8', 'marker-end': 'url(#openArrow)' });
  if (label) out += text((sx + tx) / 2, mid - 10, label, 17, color, 600, 'middle');
  return out;
}

function classDiagram() {
  const W = 5900, H = 3480;
  let body = rect(0, 0, W, H, COLORS.bg, 'none', 0);
  body += pageHeader(W, 'Logical Class Diagram', 'Service-layer view of the Express / Prisma backend', 'Source: routes + services + repositories');
  body += text(90, 242, 'JavaScript modules export functions; they are shown as UML logical classes for documentation.', 23, COLORS.muted, 500);

  const cols = [
    { x: 80, w: 1400, title: 'Identity & Administration', color: COLORS.blue },
    { x: 1540, w: 1400, title: 'Coaching & Plans', color: COLORS.green },
    { x: 3000, w: 1400, title: 'Commerce', color: COLORS.orange },
    { x: 4460, w: 1360, title: 'Content & Engagement', color: COLORS.purple },
  ];
  cols.forEach(c => body += packageBox(c.x, 285, c.w, 2725, c.title, c.color, 'module group'));

  const cards = {};
  let cardsBody = '';
  let dependencyBody = '';
  const add = (key, cfg) => { const c = umlCard(cfg); cards[key] = c; cardsBody += c.svg; return c; };
  // Identity
  add('auth', { x: 130, y: 410, w: 600, title: 'AuthService', ops: ['register', 'login', 'refresh', 'logout'], color: COLORS.blue });
  add('trainerAuth', { x: 790, y: 410, w: 600, title: 'TrainerAuthService', ops: ['registerTrainer', 'loginTrainer'], color: COLORS.blue });
  add('admin', { x: 130, y: 760, w: 600, title: 'AdminService', ops: ['login', 'register', 'refresh', 'logout', 'changePassword', 'getProfile', 'updateProfile'], color: COLORS.blue });
  add('adminAccount', { x: 790, y: 760, w: 600, title: 'AdminAccountService', ops: ['listAccounts', 'deleteAccount', 'deleteUserAccount'], color: COLORS.blue });
  add('profileImage', { x: 130, y: 1210, w: 600, title: 'ProfileImageService', ops: ['uploadProfileImage', 'deleteProfileImageByFileId'], color: COLORS.blue });
  add('trainer', { x: 790, y: 1210, w: 600, title: 'TrainerService', ops: ['getAllTrainers'], color: COLORS.blue });
  add('identityRepo', { x: 180, y: 1710, w: 1160, title: 'Identity Repositories', stereotype: 'repository', ops: ['UserRepository', 'SessionRepository', 'TrainerRepository', 'AdminRepository', 'AdminSessionRepository', 'AdminAccountRepository'], color: '#50708B', note: 'Prisma data access and session persistence' });

  // Coaching
  add('trainerReq', { x: 1590, y: 410, w: 610, title: 'TrainerRequestService', ops: ['requestTrainer', 'listMyRequests', 'listInbox', 'approveRequest', 'rejectRequest', 'cancelRequest', 'myAssignment', 'listTrainerPlayers'], color: COLORS.green });
  add('workout', { x: 2260, y: 410, w: 610, title: 'WorkoutService', ops: ['getAssignedPlan', 'getTrainerPlayerPlan', 'listCatalogExercises', 'createCatalogExercise', 'createDay', 'updateDay', 'deleteDay', 'createExercise', 'createExerciseFromCatalog', 'updateExercise', 'deleteExercise'], color: COLORS.green });
  add('nutrition', { x: 1590, y: 1050, w: 1280, title: 'NutritionService', ops: ['listAssignedMeals', 'listTrainerPlayerMeals', 'listCatalogMeals', 'createCatalogMeal', 'getMealForPlayer', 'createMeal', 'createMealFromCatalog', 'updateMeal', 'deleteMeal'], color: COLORS.green });
  add('coachRepo', { x: 1680, y: 1780, w: 1100, title: 'Coaching Repositories', stereotype: 'repository', ops: ['TrainerRequestRepository', 'AssignmentRepository', 'WorkoutRepository', 'NutritionRepository'], color: '#527B68', note: 'Prisma queries for assignments, plans and meals' });

  // Commerce
  add('subscription', { x: 3050, y: 410, w: 620, title: 'SubscriptionService', ops: ['createSubscriptionPlan', 'updateSubscriptionPlan', 'getActiveSubscriptionPlans', 'getSubscriptionPlan', 'createSubscription', 'getUserActiveSubscription', 'cancelSubscription', 'expireSubscriptions'], color: COLORS.orange });
  add('payment', { x: 3725, y: 410, w: 620, title: 'PaymentService', ops: ['createPayment', 'handlePaymentSuccess', 'getUserPaymentHistory', 'refundPayment'], color: COLORS.orange });
  add('stripe', { x: 3725, y: 920, w: 620, title: 'StripeService', stereotype: 'gateway', ops: ['createPaymentIntent', 'getPaymentIntentStatus', 'createCustomer', 'refundCharge'], color: '#B0702E' });
  add('analytics', { x: 3050, y: 1080, w: 620, title: 'AdminAnalyticsService', ops: ['getSubscriptionKpis'], color: COLORS.orange });
  add('commerceRepo', { x: 3120, y: 1780, w: 1160, title: 'PrismaClient', stereotype: 'data access', ops: ['SubscriptionPlan', 'Subscription', 'Payment', 'aggregate KPIs'], color: '#8C7052', note: 'Direct PrismaClient usage in commerce services' });

  // Content
  add('post', { x: 4510, y: 410, w: 610, title: 'PostService', ops: ['listPublicPosts', 'getPublicPost', 'createPost', 'listTrainerPosts', 'updatePost', 'deletePost', 'listAdminPosts', 'approvePost', 'rejectPost'], color: COLORS.purple });
  add('notification', { x: 5170, y: 410, w: 590, title: 'NotificationService', ops: ['registerDeviceToken', 'deleteDeviceToken', 'sendUserNotification', 'sendTrainerNotification', 'sendBroadcastNotification'], color: COLORS.purple });
  add('song', { x: 4510, y: 1060, w: 610, title: 'SongService', ops: ['listSongs', 'getSong', 'createSong', 'updateSong', 'deleteSong'], color: COLORS.purple });
  add('contentRepo', { x: 5170, y: 1060, w: 590, title: 'Content Repositories', stereotype: 'repository', ops: ['PostRepository', 'SongRepository', 'NotificationRepository'], color: '#76678F' });
  add('firebase', { x: 5170, y: 1590, w: 590, title: 'FirebaseAdminService', stereotype: 'gateway', ops: ['sendMulticastNotification'], color: '#846CB0' });

  // Dependencies inside packages
  dependencyBody += dependency(cards.auth, cards.identityRepo);
  dependencyBody += dependency(cards.trainerAuth, cards.identityRepo);
  dependencyBody += dependency(cards.admin, cards.identityRepo);
  dependencyBody += dependency(cards.adminAccount, cards.identityRepo);
  dependencyBody += dependency(cards.trainer, cards.identityRepo);
  dependencyBody += dependency(cards.trainerReq, cards.coachRepo);
  dependencyBody += dependency(cards.workout, cards.coachRepo);
  dependencyBody += dependency(cards.nutrition, cards.coachRepo);
  dependencyBody += dependency(cards.subscription, cards.commerceRepo);
  dependencyBody += dependency(cards.payment, cards.stripe, 'uses');
  dependencyBody += dependency(cards.payment, cards.commerceRepo, '', COLORS.line, 80);
  dependencyBody += dependency(cards.analytics, cards.commerceRepo);
  dependencyBody += dependency(cards.post, cards.contentRepo);
  dependencyBody += dependency(cards.song, cards.contentRepo);
  dependencyBody += dependency(cards.notification, cards.contentRepo);
  dependencyBody += dependency(cards.notification, cards.firebase, 'push delivery');
  body += dependencyBody + cardsBody;

  // Shared infrastructure band
  body += packageBox(80, 3070, 5740, 300, 'Shared Infrastructure', COLORS.navy, 'cross-cutting dependencies');
  const shared = [
    { x: 230, label: 'Express Controllers', sub: 'HTTP boundary' },
    { x: 1350, label: 'Auth / Validation Middleware', sub: 'JWT + role checks + Joi' },
    { x: 2750, label: 'MediaUploadService', sub: 'ImageKit gateway' },
    { x: 3900, label: 'Prisma ORM', sub: 'PostgreSQL persistence' },
    { x: 4930, label: 'ApiResponse + Errors', sub: 'uniform responses' },
  ];
  shared.forEach(s => { body += rect(s.x, 3165, 820, 130, '#F8FBFD', '#9FB0BF', 16, { 'stroke-width': 2 }); body += text(s.x + 410, 3217, s.label, 23, COLORS.navy, 700, 'middle'); body += text(s.x + 410, 3260, s.sub, 18, COLORS.muted, 500, 'middle'); });
  body += text(90, 3440, 'Dependency arrows show runtime calls. Controllers and repositories remain feature-scoped; only logical groupings are condensed here.', 19, COLORS.muted, 500);
  return svgDoc(W, H, body, 'Logical Class Diagram', 'Documentation-ready class diagram derived from current backend modules.');
}

function tableCard({ x, y, w = 520, name, fields, color = COLORS.blue, proxy = false, note = '' }) {
  const rowH = 31, headerH = 68;
  const h = headerH + fields.length * rowH + (note ? 46 : 18);
  let out = rect(x, y, w, h, proxy ? '#F8FAFC' : COLORS.white, proxy ? '#8EA0B2' : '#B8C5D1', 12, { 'stroke-width': 2, 'stroke-dasharray': proxy ? '10 7' : undefined, filter: proxy ? undefined : 'url(#shadow)' });
  out += rect(x, y, w, headerH, color, color, 12);
  out += rect(x, y + 48, w, 20, color, color, 0);
  out += text(x + 20, y + 44, name, 25, COLORS.white, 700);
  if (proxy) out += text(x + w - 20, y + 42, 'REFERENCE', 15, '#EAF2FF', 700, 'end');
  fields.forEach((f, i) => {
    const yy = y + headerH + 25 + i * rowH;
    const isKey = /^PK |^FK |^UK /.test(f);
    out += text(x + 18, yy, f, 17, isKey ? COLORS.navy : COLORS.ink, isKey ? 700 : 500, 'start', 'Cascadia Mono, Consolas, monospace');
  });
  if (note) out += text(x + 18, y + h - 17, note, 15, COLORS.red, 600);
  return { svg: out, x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

function relation(a, b, aLabel = '1', bLabel = '0..*', color = '#6E7D8C', dashed = false, route = null) {
  const sx = route?.sx ?? (a.x + a.w), sy = route?.sy ?? a.cy, tx = route?.tx ?? b.x, ty = route?.ty ?? b.cy;
  const mx = route?.mx ?? (sx + tx) / 2;
  let out = pathEl(`M ${sx} ${sy} H ${mx} V ${ty} H ${tx}`, color, 2.5, dashed ? { 'stroke-dasharray': '9 7' } : {});
  out += text(sx + (tx > sx ? 12 : -12), sy - 9, aLabel, 16, color, 700, tx > sx ? 'start' : 'end');
  out += text(tx + (tx > sx ? -12 : 12), ty - 9, bLabel, 16, color, 700, tx > sx ? 'end' : 'start');
  return out;
}

function erdDiagram() {
  const W = 6200, H = 4560;
  let body = rect(0, 0, W, H, COLORS.bg, 'none', 0);
  body += pageHeader(W, 'Entity–Relationship Diagram', 'PostgreSQL schema represented by prisma/schema.prisma', '22 models • PK / FK / UK • cardinalities');
  body += text(90, 242, 'Dashed User cards are aliases of the canonical User table, repeated only to keep cross-domain relationships readable.', 22, COLORS.muted, 500);

  const panels = [
    { x: 70, w: 1450, title: 'Identity & Access', color: COLORS.blue },
    { x: 1580, w: 1450, title: 'Coaching & Workout', color: COLORS.green },
    { x: 3090, w: 1450, title: 'Nutrition & Content', color: COLORS.purple },
    { x: 4600, w: 1530, title: 'Commerce & Messaging', color: COLORS.orange },
  ];
  panels.forEach(p => body += packageBox(p.x, 285, p.w, 4160, p.title, p.color, 'database domain'));
  const t = {};
  let cardsBody = '';
  let relationsBody = '';
  const add = (k, cfg) => { const c = tableCard(cfg); t[k] = c; cardsBody += c.svg; return c; };

  add('user', { x: 120, y: 410, w: 650, name: 'User', color: COLORS.blue, fields: [
    'PK id: String (uuid)', 'UK email: String', 'passwordHash: String', 'role: Role = USER', 'accountStatus: AccountStatus',
    'firstName, lastName: String', 'gender: Gender?', 'birthDate: DateTime?', 'goals: String[]', 'hasRoutine: Boolean',
    'trainTime: String?', 'heightCm, weightKg: Float', 'medicalCondition: String?', 'injuries, medications: String?',
    'deletedAt: DateTime?', 'deletedByAdminId: String?', 'deletionReason: String?', 'createdAt, updatedAt: DateTime'
  ]});
  add('profileImage', { x: 850, y: 410, w: 610, name: 'UserProfileImage', color: COLORS.blue, fields: ['PK id: String', 'FK userId -> User.id', 'url: String', 'fileId: String', 'createdAt: DateTime'] });
  add('session', { x: 850, y: 730, w: 610, name: 'UserSession', color: COLORS.blue, fields: ['PK id: String', 'FK userId -> User.id', 'UK refreshTokenHash: String', 'expiresAt: DateTime', 'revokedAt: DateTime?', 'createdAt, updatedAt: DateTime'] });
  add('device', { x: 850, y: 1080, w: 610, name: 'DeviceToken', color: COLORS.blue, fields: ['PK id: String', 'FK userId -> User.id', 'UK token: String', 'platform: DevicePlatform', 'deviceName: String?', 'lastSeenAt: DateTime', 'createdAt, updatedAt: DateTime'] });
  add('trainerProfile', { x: 120, y: 1320, w: 650, name: 'TrainerProfile', color: COLORS.blue, fields: ['PK id: String', 'UK/FK userId -> User.id', 'description: String?', 'certificates: String[]', 'createdAt, updatedAt: DateTime'] });
  add('certificate', { x: 850, y: 1490, w: 610, name: 'TrainerCertificate (legacy)', color: COLORS.blue, fields: ['PK id: String', 'FK profileId -> TrainerProfile.id', 'fileName: String', 'mimeType: String', 'path: String', 'createdAt: DateTime', 'temporary rollback data'] });
  relationsBody += relation(t.user, t.profileImage, '1', '0..*');
  relationsBody += relation(t.user, t.session, '1', '0..*', '#6E7D8C', false, { sx: t.user.x + t.user.w, sy: t.user.y + 360, tx: t.session.x, ty: t.session.cy, mx: 810 });
  relationsBody += relation(t.user, t.device, '1', '0..*', '#6E7D8C', false, { sx: t.user.x + t.user.w, sy: t.user.y + 520, tx: t.device.x, ty: t.device.cy, mx: 820 });
  relationsBody += relation(t.user, t.trainerProfile, '1', '0..1', '#6E7D8C', false, { sx: t.user.x + 330, sy: t.user.y + t.user.h, tx: t.trainerProfile.x + 330, ty: t.trainerProfile.y, mx: t.user.x + 330 });
  relationsBody += relation(t.trainerProfile, t.certificate, '1', '0..*');

  // Coaching and workout
  add('userCoach', { x: 1630, y: 410, w: 560, name: 'User', color: COLORS.green, proxy: true, fields: ['PK id: String', 'role: USER | TRAINER', 'Canonical table: Identity panel'] });
  add('request', { x: 2260, y: 410, w: 700, name: 'TrainerRequest', color: COLORS.green, fields: ['PK id: String', 'FK playerId -> User.id', 'FK trainerId -> User.id', 'status: TrainerRequestStatus', 'createdAt, updatedAt: DateTime'] });
  add('assignment', { x: 2260, y: 760, w: 700, name: 'TrainerAssignment', color: COLORS.green, fields: ['PK id: String', 'FK playerId -> User.id', 'FK trainerId -> User.id', 'status: AssignmentStatus', 'startedAt: DateTime', 'endedAt: DateTime?', 'createdAt, updatedAt: DateTime'] });
  add('plan', { x: 1630, y: 1150, w: 700, name: 'WorkoutPlan', color: COLORS.green, fields: ['PK id: String', 'UK slug: String', 'title: String?', 'FK playerId -> User.id?', 'FK trainerId -> User.id?', 'UK (playerId, trainerId)', 'createdAt, updatedAt: DateTime'] });
  add('day', { x: 2260, y: 1490, w: 700, name: 'WorkoutDay', color: COLORS.green, fields: ['PK id: String', 'FK planId -> WorkoutPlan.id', 'dayNumber: Int', 'label: String?', 'UK (planId, dayNumber)', 'createdAt, updatedAt: DateTime'] });
  add('exercise', { x: 2260, y: 1860, w: 700, name: 'WorkoutExercise', color: COLORS.green, fields: ['PK id: String', 'FK dayId -> WorkoutDay.id', 'name: String', 'description: String', 'imageUrls: String[]', 'videoUrl: String?', 'muscleGroup: MuscleGroup', 'sortOrder: Int', 'createdAt, updatedAt: DateTime'] });
  add('catalogExercise', { x: 1630, y: 2380, w: 700, name: 'WorkoutCatalogExercise', color: COLORS.green, fields: ['PK id: String', 'name: String', 'description: String', 'imageUrls: String[]', 'videoUrl: String?', 'muscleGroup: MuscleGroup', 'FK createdById -> User.id?', 'createdAt, updatedAt: DateTime'] });
  relationsBody += relation(t.userCoach, t.request, '1', '0..*');
  relationsBody += relation(t.userCoach, t.assignment, '1', '0..*', '#5C806C', false, { sx: t.userCoach.x + t.userCoach.w, sy: t.userCoach.cy + 80, tx: t.assignment.x, ty: t.assignment.cy, mx: 2225 });
  relationsBody += relation(t.userCoach, t.plan, '1', '0..*', '#5C806C', false, { sx: t.userCoach.x + 280, sy: t.userCoach.y + t.userCoach.h, tx: t.plan.x + 250, ty: t.plan.y, mx: 1900 });
  relationsBody += relation(t.plan, t.day, '1', '0..*');
  relationsBody += relation(t.day, t.exercise, '1', '0..*', '#5C806C', false, { sx: t.day.cx, sy: t.day.y + t.day.h, tx: t.exercise.cx, ty: t.exercise.y, mx: t.day.cx });
  relationsBody += relation(t.userCoach, t.catalogExercise, '0..1', '0..*', '#5C806C', false, { sx: t.userCoach.x + 100, sy: t.userCoach.y + t.userCoach.h, tx: t.catalogExercise.x + 100, ty: t.catalogExercise.y, mx: 1660 });

  // Nutrition/content
  add('userContent', { x: 3140, y: 410, w: 560, name: 'User', color: COLORS.purple, proxy: true, fields: ['PK id: String', 'roles: USER | TRAINER | ADMIN', 'Canonical table: Identity panel'] });
  add('meal', { x: 3760, y: 410, w: 700, name: 'NutritionMeal', color: COLORS.purple, fields: ['PK id: String', 'FK playerId -> User.id?', 'FK trainerId -> User.id?', 'section: MealSection', 'name: String', 'imageUrl: String', 'calories: Int', 'createdAt, updatedAt: DateTime'] });
  add('ingredient', { x: 3760, y: 830, w: 700, name: 'NutritionIngredient', color: COLORS.purple, fields: ['PK id: String', 'FK mealId -> NutritionMeal.id', 'name: String', 'quantity: String', 'calories: Int', 'sortOrder: Int'] });
  add('catalogMeal', { x: 3140, y: 1250, w: 700, name: 'NutritionCatalogMeal', color: COLORS.purple, fields: ['PK id: String', 'section: MealSection', 'name: String', 'imageUrl: String', 'calories: Int', 'FK createdById -> User.id?', 'createdAt, updatedAt: DateTime'] });
  add('catalogIngredient', { x: 3760, y: 1650, w: 700, name: 'NutritionCatalogIngredient', color: COLORS.purple, fields: ['PK id: String', 'FK mealId -> NutritionCatalogMeal.id', 'name: String', 'quantity: String', 'calories: Int', 'sortOrder: Int'] });
  add('post', { x: 3140, y: 2110, w: 700, name: 'Post', color: COLORS.purple, fields: ['PK id: String', 'FK trainerId -> User.id', 'content: String', 'imageUrl, imageFileId: String?', 'status: PostStatus', 'FK reviewedByAdminId -> User.id?', 'reviewedAt: DateTime?', 'rejectionReason: String?', 'createdAt, updatedAt: DateTime'] });
  add('song', { x: 3760, y: 2620, w: 700, name: 'Song', color: COLORS.purple, fields: ['PK id: String', 'title, artist: String', 'coverImageUrl: String', 'mp3Url: String', 'durationSeconds: Int', 'FK createdByAdminId -> User.id?', 'createdAt, updatedAt: DateTime'] });
  relationsBody += relation(t.userContent, t.meal, '0..1', '0..*');
  relationsBody += relation(t.meal, t.ingredient, '1', '0..*', '#76678F', false, { sx: t.meal.cx, sy: t.meal.y + t.meal.h, tx: t.ingredient.cx, ty: t.ingredient.y, mx: t.meal.cx });
  relationsBody += relation(t.userContent, t.catalogMeal, '0..1', '0..*', '#76678F', false, { sx: t.userContent.x + 180, sy: t.userContent.y + t.userContent.h, tx: t.catalogMeal.x + 180, ty: t.catalogMeal.y, mx: 3300 });
  relationsBody += relation(t.catalogMeal, t.catalogIngredient, '1', '0..*');
  relationsBody += relation(t.userContent, t.post, '1', '0..*', '#76678F', false, { sx: t.userContent.x + 80, sy: t.userContent.y + t.userContent.h, tx: t.post.x + 80, ty: t.post.y, mx: 3160 });
  relationsBody += relation(t.userContent, t.song, '0..1', '0..*', '#76678F', false, { sx: t.userContent.x + t.userContent.w, sy: t.userContent.cy + 40, tx: t.song.x, ty: t.song.cy, mx: 3725 });

  // Commerce/messaging
  add('userCommerce', { x: 4650, y: 410, w: 580, name: 'User', color: COLORS.orange, proxy: true, fields: ['PK id: String', 'roles: USER | ADMIN', 'Canonical table: Identity panel'] });
  add('subPlan', { x: 5310, y: 410, w: 740, name: 'SubscriptionPlan', color: COLORS.orange, fields: ['PK id: String', 'UK name: String', 'description: String?', 'price: Int (cents)', 'durationDays: Int', 'features: String[]', 'isActive: Boolean', 'createdAt, updatedAt: DateTime'] });
  add('subscription', { x: 4650, y: 950, w: 740, name: 'Subscription', color: COLORS.orange, fields: ['PK id: String', 'FK userId -> User.id', 'FK planId -> SubscriptionPlan.id', 'status: SubscriptionStatus', 'stripeCustomerId: String?', 'startDate, endDate: DateTime', 'cancelledAt: DateTime?', 'UK (userId, planId, status)', 'createdAt, updatedAt: DateTime'] });
  add('payment', { x: 5310, y: 1490, w: 740, name: 'Payment', color: COLORS.orange, fields: ['PK id: String', 'FK userId -> User.id', 'FK subscriptionId -> Subscription.id?', 'FK planId -> SubscriptionPlan.id', 'status: PaymentStatus', 'amount: Int (cents)', 'UK stripePaymentIntentId: String?', 'UK stripeChargeId: String?', 'currency: String', 'errorMessage: String?', 'createdAt, updatedAt: DateTime'] });
  add('notificationLog', { x: 4650, y: 2300, w: 900, name: 'NotificationLog', color: COLORS.orange, fields: ['PK id: String', 'createdByAdminId: String?', 'targetType: NotificationTargetType', 'targetUserId: String?', 'audienceRole: Role?', 'title, body: String', 'data: Json?', 'sentCount, failedCount: Int', 'status: NotificationLogStatus', 'failureReason: String?', 'createdAt: DateTime'], note: 'IDs are indexed but not declared as Prisma foreign keys' });
  relationsBody += relation(t.userCommerce, t.subscription, '1', '0..*', '#9A7752', false, { sx: t.userCommerce.cx, sy: t.userCommerce.y + t.userCommerce.h, tx: t.subscription.x + 180, ty: t.subscription.y, mx: 4900 });
  relationsBody += relation(t.subPlan, t.subscription, '1', '0..*', '#9A7752', false, { sx: t.subPlan.x, sy: t.subPlan.cy, tx: t.subscription.x + t.subscription.w, ty: t.subscription.cy, mx: 5270 });
  relationsBody += relation(t.subscription, t.payment, '0..1', '0..*');
  relationsBody += relation(t.subPlan, t.payment, '1', '0..*', '#9A7752', false, { sx: t.subPlan.cx, sy: t.subPlan.y + t.subPlan.h, tx: t.payment.cx, ty: t.payment.y, mx: t.subPlan.cx });
  relationsBody += relation(t.userCommerce, t.payment, '1', '0..*', '#9A7752', false, { sx: t.userCommerce.x + 40, sy: t.userCommerce.y + t.userCommerce.h, tx: t.payment.x, ty: t.payment.cy + 80, mx: 4625 });

  body += relationsBody + cardsBody;

  // Legend
  body += rect(120, 3740, 1340, 600, '#F8FBFD', '#B7C5D2', 18, { 'stroke-width': 2 });
  body += text(160, 3800, 'Legend', 25, COLORS.navy, 700);
  const legends = ['PK = primary key', 'FK = foreign key', 'UK = unique constraint', '? = nullable field', '1 / 0..1 / 0..* = cardinality'];
  legends.forEach((v, i) => body += text(170, 3850 + i * 52, `• ${v}`, 20, COLORS.ink, 500));
  body += text(90, 4520, 'Enums: Role, Gender, AccountStatus, TrainerRequestStatus, AssignmentStatus, SubscriptionStatus, PaymentStatus, DevicePlatform, NotificationTargetType, NotificationLogStatus, PostStatus, MealSection, MuscleGroup.', 18, COLORS.muted, 500);
  return svgDoc(W, H, body, 'Entity Relationship Diagram', 'Complete Prisma data model with 22 tables and documented cardinalities.');
}

function actor(x, y, label, color) {
  let out = `<circle cx="${x}" cy="${y}" r="38" fill="${COLORS.white}" stroke="${color}" stroke-width="7"/>`;
  out += line(x, y + 38, x, y + 150, color, 7);
  out += line(x - 65, y + 82, x + 65, y + 82, color, 7);
  out += line(x, y + 150, x - 60, y + 245, color, 7);
  out += line(x, y + 150, x + 60, y + 245, color, 7);
  out += text(x, y + 292, label, 26, color, 700, 'middle');
  return { svg: out, x, y, cx: x, cy: y + 120 };
}

function useCase(x, y, w, label, fill, stroke, badges = []) {
  const h = 86;
  let out = `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="3"/>`;
  out += text(x + w / 2, y + 52, label, 20, COLORS.ink, 600, 'middle');
  badges.forEach((b, i) => { out += `<circle cx="${x + w - 24 - i * 24}" cy="${y + 18}" r="8" fill="${b}"/>`; });
  return { svg: out, x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

function useCaseDiagram() {
  const W = 6000, H = 3800;
  let body = rect(0, 0, W, H, COLORS.bg, 'none', 0);
  body += pageHeader(W, 'Use Case Diagram', 'Implemented API capabilities and external integrations', 'Excluded: chat + location (TODO only)');
  body += text(90, 242, 'Colored dots identify allowed actors: Guest, Player, Trainer, Admin. External systems are connected by dashed associations.', 22, COLORS.muted, 500);

  const actorColors = { Guest: '#697B8C', Player: COLORS.blue, Trainer: COLORS.green, Admin: COLORS.red };
  const actors = [
    actor(260, 460, 'Guest', actorColors.Guest),
    actor(260, 1220, 'Player', actorColors.Player),
    actor(260, 2050, 'Trainer', actorColors.Trainer),
    actor(260, 2870, 'Admin', actorColors.Admin),
  ];
  actors.forEach(a => body += a.svg);

  // System boundary and packages
  body += rect(600, 305, 4740, 3330, '#FCFDFE', '#75889A', 28, { 'stroke-width': 4 });
  body += text(640, 365, 'Workout Backend System', 28, COLORS.navy, 700);
  const groups = [
    { x: 700, y: 430, w: 1420, h: 1310, title: 'Account & Access', color: COLORS.blue },
    { x: 2200, y: 430, w: 1450, h: 1310, title: 'Subscription & Coaching', color: COLORS.orange },
    { x: 700, y: 1810, w: 1420, h: 1700, title: 'Workout & Nutrition', color: COLORS.green },
    { x: 2200, y: 1810, w: 3040, h: 1700, title: 'Content, Notifications & Admin', color: COLORS.purple },
  ];
  groups.forEach(g => { body += rect(g.x, g.y, g.w, g.h, '#FFFFFF', '#C2CED8', 20, { 'stroke-width': 2 }); body += rect(g.x, g.y, g.w, 72, g.color, g.color, 20); body += rect(g.x, g.y + 48, g.w, 24, g.color, g.color, 0); body += text(g.x + 28, g.y + 47, g.title, 25, COLORS.white, 700); });

  const addCases = (items, startX, startY, cols, caseW, gapX, gapY, fill, stroke) => {
    const result = [];
    items.forEach((it, i) => {
      const c = useCase(startX + (i % cols) * gapX, startY + Math.floor(i / cols) * gapY, caseW, it[0], fill, stroke, it.slice(1).map(a => actorColors[a]));
      result.push(c); body += c.svg;
    });
    return result;
  };

  const account = addCases([
    ['Register player', 'Guest'], ['Player login', 'Guest'], ['Trainer registration', 'Guest'], ['Trainer login', 'Guest'],
    ['Admin login', 'Guest'], ['Refresh / logout', 'Player', 'Trainer', 'Admin'], ['View / update profile', 'Player', 'Trainer'],
    ['Upload profile images', 'Player', 'Trainer'], ['Delete own account', 'Player', 'Trainer'], ['List trainers', 'Guest'],
  ], 760, 550, 2, 600, 650, 205, COLORS.cyan, COLORS.blue);

  const coaching = addCases([
    ['List active plans', 'Guest'], ['Create payment intent', 'Player'], ['View subscription', 'Player'], ['Cancel subscription', 'Player'],
    ['View payment history', 'Player'], ['Request trainer', 'Player'], ['Cancel trainer request', 'Player'], ['View my assignment', 'Player'],
    ['Review request inbox', 'Trainer'], ['Approve / reject request', 'Trainer'], ['List assigned players', 'Trainer'], ['Refund payment', 'Admin'],
  ], 2260, 550, 2, 610, 660, 190, COLORS.orangeBg, COLORS.orange);

  const training = addCases([
    ['View assigned workout plan', 'Player'], ['View assigned meals', 'Player'], ['View meal details', 'Player'],
    ['Manage exercise catalog', 'Trainer'], ['Manage workout days', 'Trainer'], ['Manage plan exercises', 'Trainer'],
    ['Add exercise from catalog', 'Trainer'], ['Manage meal catalog', 'Trainer'], ['Manage player meals', 'Trainer'],
    ['Add meal from catalog', 'Trainer'], ['Verify active assignment', 'Player', 'Trainer'],
  ], 760, 1940, 2, 600, 650, 230, COLORS.greenBg, COLORS.green);

  const content = addCases([
    ['Browse approved posts', 'Guest'], ['Create / edit own posts', 'Trainer'], ['Delete own posts', 'Trainer'],
    ['View own post status', 'Trainer'], ['List / play songs', 'Player', 'Admin'], ['Manage song catalog', 'Admin'],
    ['Register device token', 'Player', 'Trainer', 'Admin'], ['Remove device token', 'Player', 'Trainer', 'Admin'],
    ['Send direct notification', 'Admin'], ['Send broadcast notification', 'Admin'], ['Moderate posts', 'Admin'],
    ['Manage users / trainers', 'Admin'], ['Manage subscription plans', 'Admin'], ['View subscription KPIs', 'Admin'],
    ['Manage admin profile', 'Admin'], ['Register another admin', 'Admin'],
  ], 2260, 1940, 3, 860, 930, 230, COLORS.purpleBg, COLORS.purple);

  // Actor associations to group access points (clean overview while badges preserve per-case authorization)
  const assoc = (a, x, y, color) => pathEl(`M ${a.x + 80} ${a.cy} H ${x - 50} Q ${x} ${a.cy} ${x} ${y}`, color, 4, { opacity: 0.55 });
  body += assoc(actors[0], 700, 730, actorColors.Guest);
  body += assoc(actors[0], 2200, 620, actorColors.Guest);
  body += assoc(actors[1], 700, 1190, actorColors.Player);
  body += assoc(actors[1], 2200, 1130, actorColors.Player);
  body += assoc(actors[1], 700, 2180, actorColors.Player);
  body += assoc(actors[2], 700, 1410, actorColors.Trainer);
  body += assoc(actors[2], 2200, 1450, actorColors.Trainer);
  body += assoc(actors[2], 700, 2760, actorColors.Trainer);
  body += assoc(actors[2], 2200, 2220, actorColors.Trainer);
  body += assoc(actors[3], 2200, 3300, actorColors.Admin);

  // External actors
  const stripeActor = actor(5660, 610, 'Stripe', COLORS.orange);
  const firebaseActor = actor(5660, 1620, 'Firebase', COLORS.purple);
  const imagekitActor = actor(5660, 2720, 'ImageKit', COLORS.blue);
  body += stripeActor.svg + firebaseActor.svg + imagekitActor.svg;
  body += pathEl(`M 5340 760 H 5520`, COLORS.orange, 4, { 'stroke-dasharray': '12 8' });
  body += text(5430, 735, 'payment + webhook', 17, COLORS.orange, 600, 'middle');
  body += pathEl(`M 5240 2350 H 5480 V 1740 H 5520`, COLORS.purple, 4, { 'stroke-dasharray': '12 8' });
  body += text(5480, 2020, 'push delivery', 17, COLORS.purple, 600, 'middle', 'Segoe UI, Arial', { transform: 'rotate(-90 5480 2020)' });
  body += pathEl(`M 5240 3000 H 5480 V 2840 H 5520`, COLORS.blue, 4, { 'stroke-dasharray': '12 8' });
  body += text(5460, 2968, 'media upload/delete', 17, COLORS.blue, 600, 'end');

  // Legend
  body += rect(80, 3605, 5840, 130, COLORS.white, '#BAC6D1', 16, { 'stroke-width': 2 });
  body += text(120, 3660, 'Actor key:', 21, COLORS.navy, 700);
  [['Guest', actorColors.Guest], ['Player', actorColors.Player], ['Trainer', actorColors.Trainer], ['Admin', actorColors.Admin]].forEach((v, i) => {
    body += `<circle cx="${300 + i * 260}" cy="3653" r="10" fill="${v[1]}"/>` + text(320 + i * 260, 3660, v[0], 19, COLORS.ink, 600);
  });
  body += text(1450, 3660, 'Notes:', 21, COLORS.navy, 700);
  body += text(1540, 3660, 'Payment activation is completed by Stripe webhook. Workout and nutrition access requires an ACTIVE TrainerAssignment.', 19, COLORS.muted, 500);
  body += text(120, 3708, 'Chat and location modules are intentionally omitted because their route files contain TODO placeholders only.', 18, COLORS.red, 600);
  return svgDoc(W, H, body, 'Use Case Diagram', 'Use case overview derived from implemented Express routes, role middleware, and integrations.');
}

const outputs = [
  ['class-diagram.svg', classDiagram()],
  ['erd-diagram.svg', erdDiagram()],
  ['usecase-diagram.svg', useCaseDiagram()],
];

for (const [name, content] of outputs) fs.writeFileSync(path.join(OUT, name), content, 'utf8');
console.log(outputs.map(([n]) => path.join(OUT, n)).join('\n'));
