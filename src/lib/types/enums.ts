/**
 * ブログ記事のステータス
 */
export type BlogStatus = 'draft' | 'published';

/**
 * メンバーのカテゴリ
 */
export enum MemberCategory {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

/**
 * 先生の職位
 */
export enum TeacherPosition {
  PROFESSOR = '教授',
  ASSOCIATE_PROFESSOR = '准教授',
  ASSISTANT_PROFESSOR = '助教',
  LECTURER = '講師',
}

/**
 * 学生の学年
 */
export enum StudentPosition {
  DOCTORAL = '博士',
  MASTER = '修士',
  UNDERGRADUATE = '学部生',
  RESEARCH_STUDENT = '研究生',
}

/**
 * 全メンバーの職位・学年（Union型）
 */
export type MemberPosition = TeacherPosition | StudentPosition;
