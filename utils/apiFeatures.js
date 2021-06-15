class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1A - Filtering
    //BUILD THE QUERY
    //we create a copy of the req.query
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //we delete all the properties from the query object
    //that are not related to filtering
    excludedFields.forEach((el) => delete queryObj[el]);

    //1B - Filtering with queries
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(lt|lte|gt|gte)\b/g, (match) => `$${match}`);
    console.log(queryStr);

    //Tour.find() returns a query object
    //if we await it, it comes back with all the data that match our query
    //we cannot implement sorting, or pagination on the matches
    //we can do it only on the Query object
    //that's why we save the query object for later
    this.query = this.query.find(JSON.parse(queryStr));
    //making the method chainable
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('_id');
    }
    return this;
  }

  limit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    console.log(this.queryString);
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const whereToSkip = (page - 1) * limit;
    this.query = this.query.skip(whereToSkip).limit(limit);
    return this;
  }
}

module.exports = APIfeatures;
