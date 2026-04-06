function paginate({ page = 1, limit = 10 } = {}) {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (currentPage - 1) * perPage;

  return { currentPage, perPage, skip };
}

function buildPaginationMeta({ currentPage, perPage, totalItems }) {
  return {
    currentPage,
    perPage,
    totalItems,
    totalPages: Math.ceil(totalItems / perPage),
  };
}

module.exports = { paginate, buildPaginationMeta };
