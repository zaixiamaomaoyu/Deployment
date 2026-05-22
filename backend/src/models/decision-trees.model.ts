import { DatabaseService } from '../services/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface DecisionTree extends RowDataPacket {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDecisionTreeDto {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateDecisionTreeDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export class DecisionTreesModel {
  /**
   * 创建决策树
   */
  static async create(treeData: CreateDecisionTreeDto): Promise<number> {
    const { name, description, is_active = true } = treeData;

    const sql = `
      INSERT INTO decision_trees (name, description, is_active)
      VALUES (?, ?, ?)
    `;

    const result = await DatabaseService.execute(sql, [name, description, is_active ? 1 : 0]);
    return result.insertId;
  }

  /**
   * 获取所有活跃的决策树
   */
  static async findActive(): Promise<DecisionTree[]> {
    const sql = 'SELECT * FROM decision_trees WHERE is_active = TRUE ORDER BY created_at DESC';
    return await DatabaseService.query<DecisionTree[]>(sql);
  }

  /**
   * 根据 ID 查找决策树
   */
  static async findById(id: number): Promise<DecisionTree | null> {
    const sql = 'SELECT * FROM decision_trees WHERE id = ?';
    const trees = await DatabaseService.query<DecisionTree[]>(sql, [id]);
    return trees[0] || null;
  }

  /**
   * 更新决策树
   */
  static async update(id: number, treeData: UpdateDecisionTreeDto): Promise<boolean> {
    const { name, description, is_active } = treeData;

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return false;
    }

    params.push(id);
    const sql = `UPDATE decision_trees SET ${updates.join(', ')} WHERE id = ?`;

    const result = await DatabaseService.execute(sql, params);
    return result.affectedRows > 0;
  }
}