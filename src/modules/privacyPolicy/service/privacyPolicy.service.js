const privacyPolicyRepository = require('../repository/privacyPolicy.repository');

function mapPrivacyPolicy(privacyPolicy) {
  if (!privacyPolicy) {
    return {
      content: '',
      updatedAt: null,
    };
  }

  return {
    content: privacyPolicy.content,
    updatedAt: privacyPolicy.updatedAt,
  };
}

async function getPrivacyPolicy() {
  const privacyPolicy = await privacyPolicyRepository.findPrivacyPolicy();
  return mapPrivacyPolicy(privacyPolicy);
}

async function updatePrivacyPolicy(content) {
  const privacyPolicy = await privacyPolicyRepository.upsertPrivacyPolicy(content);
  return mapPrivacyPolicy(privacyPolicy);
}

module.exports = {
  getPrivacyPolicy,
  updatePrivacyPolicy,
};
