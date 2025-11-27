const pool = require('../config/database');

class DatabaseUtils {
  // Execute a query with error handling
  static async query(text, params = []) {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Get a client from the pool for transactions
  static async getClient() {
    return await pool.connect();
  }

  // Execute multiple queries in a transaction
  static async transaction(queries) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const { text, params } of queries) {
        const result = await client.query(text, params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Check if a table exists
  static async tableExists(tableName) {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `;
    
    const result = await this.query(query, [tableName]);
    return result.rows[0].exists;
  }

  // Get table row count
  static async getRowCount(tableName) {
    const query = `SELECT COUNT(*) FROM ${tableName}`;
    const result = await this.query(query);
    return parseInt(result.rows[0].count);
  }

  // Pagination helper
  static buildPaginationQuery(baseQuery, page = 1, limit = 10, orderBy = 'id', orderDirection = 'DESC') {
    const offset = (page - 1) * limit;
    return `
      ${baseQuery}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $${baseQuery.split('$').length} OFFSET $${baseQuery.split('$').length + 1}
    `;
  }

  // Build WHERE clause from filters
  static buildWhereClause(filters) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(',');
          conditions.push(`${key} IN (${placeholders})`);
          params.push(...value);
        } else if (typeof value === 'string' && value.includes('%')) {
          conditions.push(`${key} ILIKE $${paramIndex++}`);
          params.push(value);
        } else {
          conditions.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      }
    });

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }
}

module.exports = DatabaseUtils;