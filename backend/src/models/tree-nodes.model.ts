import { DatabaseService } from '../services/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface TreeNode extends RowDataPacket {
  id: number;
  tree_id: number;
  parent_id?: number;
  question: string;
  options?: any;
  result?: string;
  result_type: 'continue' | 'recommendation' | 'guide';
  guide_content?: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTreeNodeDto {
  tree_id: number;
  parent_id?: number;
  question: string;
  options?: any;
  result?: string;
  result_type?: 'continue' | 'recommendation' | 'guide';
  guide_content?: string;
  sort_order?: number;
}

export class TreeNodesModel {
  /**
   * 创建决策树节点
   */
  static async create(nodeData: CreateTreeNodeDto): Promise<number> {
    const {
      tree_id,
      parent_id,
      question,
      options,
      result,
      result_type = 'continue',
      guide_content,
      sort_order = 0
    } = nodeData;

    const sql = `
      INSERT INTO tree_nodes
      (tree_id, parent_id, question, options, result, result_type, guide_content, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result_ = await DatabaseService.execute(sql, [
      tree_id, parent_id, question,
      JSON.stringify(options), result, result_type,
      guide_content, sort_order
    ]);

    return result_.insertId;
  }

  /**
   * 获取决策树的所有节点
   */
  static async findByTree(treeId: number): Promise<TreeNode[]> {
    const sql = 'SELECT * FROM tree_nodes WHERE tree_id = ? ORDER BY sort_order, id';
    const nodes = await DatabaseService.query<TreeNode[]>(sql, [treeId]);

    // 解析 JSON 字段
    nodes.forEach(node => {
      if (node.options) node.options = JSON.parse(node.options);
    });

    return nodes;
  }

  /**
   * 获取决策树的根节点
   */
  static async findRootByTree(treeId: number): Promise<TreeNode | null> {
    const sql = 'SELECT * FROM tree_nodes WHERE tree_id = ? AND parent_id IS NULL ORDER BY sort_order LIMIT 1';
    const nodes = await DatabaseService.query<TreeNode[]>(sql, [treeId]);

    if (nodes[0]) {
      if (nodes[0].options) nodes[0].options = JSON.parse(nodes[0].options);
    }

    return nodes[0] || null;
  }

  /**
   * 获取节点的子节点
   */
  static async findChildren(parentId: number): Promise<TreeNode[]> {
    const sql = 'SELECT * FROM tree_nodes WHERE parent_id = ? ORDER BY sort_order, id';
    const nodes = await DatabaseService.query<TreeNode[]>(sql, [parentId]);

    // 解析 JSON 字段
    nodes.forEach(node => {
      if (node.options) node.options = JSON.parse(node.options);
    });

    return nodes;
  }

  /**
   * 根据 ID 查找节点
   */
  static async findById(id: number): Promise<TreeNode | null> {
    const sql = 'SELECT * FROM tree_nodes WHERE id = ?';
    const nodes = await DatabaseService.query<TreeNode[]>(sql, [id]);

    if (nodes[0]) {
      if (nodes[0].options) nodes[0].options = JSON.parse(nodes[0].options);
    }

    return nodes[0] || null;
  }
}