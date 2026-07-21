// Server-side pagination for list endpoints.
//
// These endpoints used to return whole collections: /api/orders alone shipped
// 754 KB of JSON for 8,386 records. Serialising that is synchronous, so ten
// people opening the orders page at once blocked the event loop and each
// request took ~21s. Capping the page size keeps responses small and the
// server responsive.

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// Reads ?page= and ?limit= defensively: anything missing, negative or
// non-numeric falls back to the defaults rather than reaching the database as
// NaN, and limit is capped so a client cannot ask for the whole table again.
function getPageParams(req, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
    const rawPage = parseInt(req.query.page, 10);
    const rawLimit = parseInt(req.query.limit, 10);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, maxLimit)
        : defaultLimit;

    return { page, limit, skip: (page - 1) * limit };
}

// Runs the query and its count together and returns the page plus the metadata
// the UI needs to render its controls.
async function paginate(model, filter, { page, limit, skip }, { sort, populate } = {}) {
    let query = model.find(filter).skip(skip).limit(limit);
    if (sort) query = query.sort(sort);
    if (populate) {
        for (const p of [].concat(populate)) {
            query = query.populate(p.path || p, p.select);
        }
    }

    const [items, total] = await Promise.all([
        query.exec(),
        model.countDocuments(filter)
    ]);

    return {
        items,
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit))
    };
}

module.exports = { getPageParams, paginate, DEFAULT_LIMIT, MAX_LIMIT };
