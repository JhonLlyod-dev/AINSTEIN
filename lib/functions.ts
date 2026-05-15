import { get, ref } from "firebase/database";
import { db } from "../services/firebase";

export const getQuizAvg = async (id : string) => {

  const quizRef = ref(db, `quizes/${id}`);
  const snapshot = await get(quizRef);
  const data = snapshot.val();

  console.log(id);
  console.log(data);

if (!data) {
  return ({
    total: 0,
    avgScore: 0,
    bestScore: 0,
  });
}

// ✅ THIS is the correct structure handling
const quizList = Object.values(data); // quizzes inside group

const taken = quizList.filter((q: any) => q?.attempts > 0);

const avgScore = taken.length
  ? Math.round(
      taken.reduce(
        (sum: number, q: any) =>
          sum + (q.score / q.totalItems) * 100,
        0
      ) / taken.length
    )
  : 0;

const bestScore = taken.length
  ? Math.max(
      ...taken.map((q: any) =>
        Math.round((q.score / q.totalItems) * 100)
      )
    )
  : 0;

return({
  total: quizList.length,
  avgScore,
  bestScore,
});

}


export const getFlashAvg = async (id: string) => {
  const flashRef = ref(db, `flashcards/${id}`);
  const snapshot = await get(flashRef);
  const data = snapshot.val();

  if (!data) {
    return {
      total: 0,
      totalCards: 0,
      avgAccuracy: 0,
      bestAccuracy: 0,
    };
  }

  const flashList = Object.values(data);

  const attempted = flashList.filter(
    (d: any) => (d.attempts || 0) > 0
  );

  const totalCards = flashList.reduce(
    (sum: number, d: any) => sum + (d.totalCards || 0),
    0
  );

  const scores = attempted.map((d: any) => {
    if (!d.totalCards) return 0;
    return Math.round(( (d.bestScore || 0) / d.totalCards ) * 100);
  });

  const avgAccuracy = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const bestAccuracy = scores.length
    ? Math.max(...scores)
    : 0;

  return {
    total: flashList.length,
    totalCards,
    avgAccuracy,
    bestAccuracy,
  };
};