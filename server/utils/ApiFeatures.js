class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  // Search by keyword (name, description, city)
  search() {
    const keyword = this.queryStr.keyword
      ? {
          $or: [
            { name: { $regex: this.queryStr.keyword, $options: 'i' } },
            { description: { $regex: this.queryStr.keyword, $options: 'i' } },
            { 'address.city': { $regex: this.queryStr.keyword, $options: 'i' } },
          ],
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  // Filter by price, rating, category, etc.
  filter() {
    const queryCopy = { ...this.queryStr };

    // Fields to exclude from filtering
    const removeFields = ['keyword', 'page', 'limit', 'sort', 'fields'];
    removeFields.forEach((field) => delete queryCopy[field]);

    // Handle city filter
    if (queryCopy.city) {
      queryCopy['address.city'] = { $regex: queryCopy.city, $options: 'i' };
      delete queryCopy.city;
    }

    // Handle amenities filter (comma-separated)
    if (queryCopy.amenities) {
      queryCopy.amenities = { $all: queryCopy.amenities.split(',') };
    }

    // Handle category filter
    if (queryCopy.category) {
      queryCopy.category = queryCopy.category;
    }

    // Advanced filtering (gt, gte, lt, lte)
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  // Sort results
  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // Select specific fields
  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  // Pagination
  paginate(resultPerPage) {
    const page = parseInt(this.queryStr.page, 10) || 1;
    const limit = parseInt(this.queryStr.limit, 10) || resultPerPage;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = ApiFeatures;
