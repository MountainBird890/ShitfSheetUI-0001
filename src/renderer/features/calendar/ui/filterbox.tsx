import { apiUrl } from '../../../../lib/api';
import type { StaffWork } from '../../../../backend/data/basetype';

// デバウンス付きフェッチ
let timer: ReturnType<typeof setTimeout> | null = null;

export const fetchUserName = (
  q: string,
  onResult: (data: StaffWork[]) => void
) => {
  // 前のタイマーをキャンセル
  if (timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    console.log("search is correct");
    try {
      const res = await fetch(apiUrl(`http://localhost:3000/search?q=${q}`));
      const userdata: StaffWork[] = await res.json();
      onResult(userdata); // 結果をコールバックで返す
    } catch (e) {
      console.error("検索エラー:", e);
    }
  }, 500);
};