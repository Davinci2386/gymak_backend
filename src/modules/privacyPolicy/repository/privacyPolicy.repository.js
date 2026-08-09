const { prisma } = require('../../../config');

const PRIVACY_POLICY_ID = 1;

function findPrivacyPolicy() {
  return prisma.privacyPolicy.findUnique({
    where: { id: PRIVACY_POLICY_ID },
  });
}

function upsertPrivacyPolicy(content) {
  return prisma.privacyPolicy.upsert({
    where: { id: PRIVACY_POLICY_ID },
    update: { content },
    create: {
      id: PRIVACY_POLICY_ID,
      content,
    },
  });
}

module.exports = {
  findPrivacyPolicy,
  upsertPrivacyPolicy,
};
