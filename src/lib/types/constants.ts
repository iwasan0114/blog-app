import { Member } from './entities';
import {
  MemberCategory,
  TeacherPosition,
  StudentPosition,
  MemberPosition,
} from './enums';

/**
 * カテゴリ表示名マッピング
 */
export const MEMBER_CATEGORY_LABELS: Record<MemberCategory, string> = {
  [MemberCategory.TEACHER]: '先生',
  [MemberCategory.STUDENT]: '学生',
};

/**
 * 職位・学年の表示順序（先生）
 */
export const TEACHER_POSITION_ORDER: TeacherPosition[] = [
  TeacherPosition.PROFESSOR,
  TeacherPosition.ASSOCIATE_PROFESSOR,
  TeacherPosition.ASSISTANT_PROFESSOR,
  TeacherPosition.LECTURER,
];

/**
 * 職位・学年の表示順序（学生）
 */
export const STUDENT_POSITION_ORDER: StudentPosition[] = [
  StudentPosition.DOCTORAL,
  StudentPosition.MASTER,
  StudentPosition.UNDERGRADUATE,
  StudentPosition.RESEARCH_STUDENT,
];

/**
 * カテゴリ別の職位・学年オプション
 */
export const POSITION_OPTIONS_BY_CATEGORY = {
  [MemberCategory.TEACHER]: Object.values(TeacherPosition).map(position => ({
    value: position,
    label: position,
  })),
  [MemberCategory.STUDENT]: Object.values(StudentPosition).map(position => ({
    value: position,
    label: position,
  })),
};

/**
 * 全ての職位・学年オプション
 */
export const ALL_POSITION_OPTIONS = [
  ...POSITION_OPTIONS_BY_CATEGORY[MemberCategory.TEACHER],
  ...POSITION_OPTIONS_BY_CATEGORY[MemberCategory.STUDENT],
];

/**
 * カテゴリオプション
 */
export const CATEGORY_OPTIONS = Object.values(MemberCategory).map(category => ({
  value: category,
  label: MEMBER_CATEGORY_LABELS[category],
}));

/**
 * カテゴリ別にメンバーをグループ化する関数の戻り値型
 */
export interface GroupedMembers {
  [MemberCategory.TEACHER]: Member[];
  [MemberCategory.STUDENT]: Member[];
}

/**
 * 職位からカテゴリを取得する関数の型
 */
export type GetCategoryFromPosition = (
  position: MemberPosition
) => MemberCategory;

/**
 * メンバーをカテゴリ別にグループ化する関数の型
 */
export type GroupMembersByCategory = (members: Member[]) => GroupedMembers;

/**
 * 職位からカテゴリを判定
 */
export const getCategoryFromPosition = (
  position: MemberPosition
): MemberCategory => {
  if (Object.values(TeacherPosition).includes(position as TeacherPosition)) {
    return MemberCategory.TEACHER;
  }
  return MemberCategory.STUDENT;
};

/**
 * カテゴリに応じた職位オプションを取得
 */
export const getPositionOptionsByCategory = (category: MemberCategory) => {
  return POSITION_OPTIONS_BY_CATEGORY[category];
};
