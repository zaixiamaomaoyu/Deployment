import { DatabaseService } from '../services/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface Content extends RowDataPacket {
  id: number;
  domain: 'build' | 'platform' | 'server' | 'automation' | 'domain' | 'container';
  level: number;
  title: string;
  description?: string;
  content?: string;
  examples?: any;
  tags?: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateContentDto {
  domain: 'build' | 'platform' | 'server' | 'automation' | 'domain' | 'container';
  level: number;
  title: string;
  description?: string;
  content?: string;
  examples?: any;
  tags?: any;
}

export interface UpdateContentDto {
  domain?: 'build' | 'platform' | 'server' | 'automation' | 'domain' | 'container';
  level?: number;
  title?: string;
  description?: string;
  content?: string;
  examples?: any;
  tags?: any;
}

export interface ContentQueryOptions {
  domain?: string;
  level?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export class ContentsModel {
  /**
   * 创建知识内容
   */
  static async create(contentData: CreateContentDto): Promise<number> {
    const { domain, level, title, description, content, examples, tags } = contentData;

    const sql = `
      INSERT INTO contents (domain, level, title, description, content, examples, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await DatabaseService.execute(sql, [
      domain, level, title, description, content,
      JSON.stringify(examples), JSON.stringify(tags)
    ]);
    return result.insertId;
  }

  /**
   * 根据 ID 查找内容
   */
  static async findById(id: number): Promise<Content | null> {
    const sql = 'SELECT * FROM contents WHERE id = ?';
    const contents = await DatabaseService.query<Content[]>(sql, [id]);

    if (contents[0]) {
      // 解析 JSON 字段
      const content = contents[0];
      if (content.examples && typeof content.examples === 'string') content.examples = JSON.parse(content.examples);
      if (content.tags && typeof content.tags === 'string') content.tags = JSON.parse(content.tags);
    }

    return contents[0] || null;
  }

  /**
   * 根据查询条件获取内容列表
   */
  static async findAll(options: ContentQueryOptions = {}): Promise<{
    contents: Content[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      domain,
      level,
      search,
      page = 1,
      limit = 10
    } = options;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (domain) {
      conditions.push('domain = ?');
      params.push(domain);
    }

    if (level) {
      conditions.push('level = ?');
      params.push(level);
    }

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ? OR content LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [contents, totalResult] = await Promise.all([
      DatabaseService.query<Content[]>(
        `SELECT * FROM contents ${whereClause} ORDER BY domain, level, created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      DatabaseService.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM contents ${whereClause}`,
        params
      )
    ]);

    // 解析 JSON 字段
    contents.forEach(content => {
      if (content.examples && typeof content.examples === 'string') content.examples = JSON.parse(content.examples);
      if (content.tags && typeof content.tags === 'string') content.tags = JSON.parse(content.tags);
    });

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      contents,
      total,
      page,
      totalPages
    };
  }

  /**
   * 根据领域获取内容
   */
  static async findByDomain(domain: string, page: number = 1, limit: number = 10): Promise<{
    contents: Content[];
    total: number;
  }> {
    const result = await this.findAll({ domain, page, limit });
    return {
      contents: result.contents,
      total: result.total
    };
  }

  /**
   * 根据层级获取内容
   */
  static async findByLevel(level: number, page: number = 1, limit: number = 10): Promise<{
    contents: Content[];
    total: number;
  }> {
    const result = await this.findAll({ level, page, limit });
    return {
      contents: result.contents,
      total: result.total
    };
  }

  /**
   * 搜索内容
   */
  static async search(query: string, page: number = 1, limit: number = 10): Promise<{
    contents: Content[];
    total: number;
  }> {
    const result = await this.findAll({ search: query, page, limit });
    return {
      contents: result.contents,
      total: result.total
    };
  }

  /**
   * 更新内容
   */
  static async update(id: number, contentData: UpdateContentDto): Promise<boolean> {
    const { domain, level, title, description, content, examples, tags } = contentData;

    const updates: string[] = [];
    const params: any[] = [];

    if (domain !== undefined) {
      updates.push('domain = ?');
      params.push(domain);
    }
    if (level !== undefined) {
      updates.push('level = ?');
      params.push(level);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (examples !== undefined) {
      updates.push('examples = ?');
      params.push(JSON.stringify(examples));
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(tags));
    }

    if (updates.length === 0) {
      return false;
    }

    params.push(id);
    const sql = `UPDATE contents SET ${updates.join(', ')} WHERE id = ?`;

    const result = await DatabaseService.execute(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * 删除内容
   */
  static async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM contents WHERE id = ?';
    const result = await DatabaseService.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 获取内容统计信息
   */
  static async getStats(): Promise<{
    total_contents: number;
    by_domain: { [key: string]: number };
    by_level: { [key: string]: number };
  }> {
    const [totalResult, domainResult, levelResult] = await Promise.all([
      DatabaseService.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM contents'),
      DatabaseService.query<RowDataPacket[]>(
        'SELECT domain, COUNT(*) as count FROM contents GROUP BY domain'
      ),
      DatabaseService.query<RowDataPacket[]>(
        'SELECT level, COUNT(*) as count FROM contents GROUP BY level'
      )
    ]);

    const by_domain: { [key: string]: number } = {};
    domainResult.forEach(row => {
      by_domain[row.domain] = row.count;
    });

    const by_level: { [key: string]: number } = {};
    levelResult.forEach(row => {
      by_level[`level_${row.level}`] = row.count;
    });

    return {
      total_contents: totalResult[0]?.total || 0,
      by_domain,
      by_level
    };
  }

  /**
   * 获取相邻内容（上一篇/下一篇）
   * - 提供 domain：限制在同 domain 内按 id 顺序导航
   * - 不提供 domain：按全局 id 顺序导航
   */
  static async findNeighbors(
    id: number,
    domain?: string
  ): Promise<{ prev: Content | null; next: Content | null }> {
    const useDomainScope = typeof domain === 'string' && domain.length > 0;

    const prevSql = useDomainScope
      ? 'SELECT * FROM contents WHERE domain = ? AND id < ? ORDER BY id DESC LIMIT 1'
      : 'SELECT * FROM contents WHERE id < ? ORDER BY id DESC LIMIT 1';
    const nextSql = useDomainScope
      ? 'SELECT * FROM contents WHERE domain = ? AND id > ? ORDER BY id ASC LIMIT 1'
      : 'SELECT * FROM contents WHERE id > ? ORDER BY id ASC LIMIT 1';

    const prevParams = useDomainScope ? [domain, id] : [id];
    const nextParams = useDomainScope ? [domain, id] : [id];

    const [prevResult, nextResult] = await Promise.all([
      DatabaseService.query<Content[]>(prevSql, prevParams),
      DatabaseService.query<Content[]>(nextSql, nextParams),
    ]);

    const prev = prevResult[0] || null;
    const next = nextResult[0] || null;

    // 解析 JSON 字段
    [prev, next].forEach(item => {
      if (item) {
        try {
          if (item.examples) item.examples = JSON.parse(item.examples);
          if (item.tags) item.tags = JSON.parse(item.tags);
        } catch {
          // 忽略损坏的 JSON 字段，保持原始值
        }
      }
    });

    return { prev, next };
  }

  /**
   * 获取热门内容（基于用户查看次数）
   */
  static async getPopular(limit: number = 10): Promise<Content[]> {
    const sql = `
      SELECT c.*, COUNT(up.id) as view_count
      FROM contents c
      LEFT JOIN user_progress up ON c.id = up.content_id
      GROUP BY c.id
      ORDER BY view_count DESC, c.created_at DESC
      LIMIT ?
    `;

    const contents = await DatabaseService.query<Content[]>(sql, [limit]);

    // 解析 JSON 字段
    contents.forEach(content => {
      if (content.examples && typeof content.examples === 'string') content.examples = JSON.parse(content.examples);
      if (content.tags && typeof content.tags === 'string') content.tags = JSON.parse(content.tags);
    });

    return contents;
  }
}