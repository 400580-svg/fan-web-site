"use client";

import { useState } from "react";

type Question = {
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};

const questions: Question[] = [
  {
    prompt: "How many players from one team are on the field during a standard play?",
    choices: ["9", "10", "11", "12"],
    answer: 2,
    explanation: "A standard NFL play has 11 players from each team on the field."
  },
  {
    prompt: "How many points is a touchdown worth before the try?",
    choices: ["3", "6", "7", "8"],
    answer: 1,
    explanation: "A touchdown is worth six points. The team can then attempt an extra point or a two-point conversion."
  },
  {
    prompt: "How many yards does an offense usually need to gain for a first down?",
    choices: ["5", "8", "10", "15"],
    answer: 2,
    explanation: "The offense gets four downs to advance the ball ten yards for a new set of downs."
  },
  {
    prompt: "How many points is a successful field goal worth?",
    choices: ["1", "2", "3", "6"],
    answer: 2,
    explanation: "A field goal is worth three points."
  },
  {
    prompt: "What is the name of the NFL championship game?",
    choices: ["The Rose Bowl", "The Super Bowl", "The Pro Bowl", "The World Series"],
    answer: 1,
    explanation: "The Super Bowl is the NFL's championship game."
  }
];

export default function QuickQuiz() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const finished = questionIndex >= questions.length;

  const restart = () => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
  };

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <section className="section-layout quick-quiz" aria-labelledby="quiz-title">
        <div className="quick-quiz-results">
          <div className="eyebrow">Final score</div>
          <h2 id="quiz-title">{score} out of {questions.length}</h2>
          <p>{percentage === 100 ? "Perfect score. You know your football." : percentage >= 60 ? "Nice work. You know the basics." : "Good start. Try another round and beat your score."}</p>
          <button className="primary-button" onClick={restart}>Play again</button>
        </div>
      </section>
    );
  }

  const question = questions[questionIndex];
  const answeredCorrectly = selectedAnswer === question.answer;

  return (
    <section className="section-layout quick-quiz" aria-labelledby="quiz-title">
      <header className="quick-quiz-header">
        <div>
          <div className="eyebrow">Five questions · One point each</div>
          <h2 id="quiz-title">Football quick quiz</h2>
          <p>A quick test of your NFL basics.</p>
        </div>
        <div className="quick-quiz-score" aria-live="polite">Score <b>{score}</b></div>
      </header>

      <div className="quick-quiz-progress" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={questionIndex}>
        <span style={{ width: `${(questionIndex / questions.length) * 100}%` }} />
      </div>

      <div className="quick-quiz-card">
        <div className="quick-quiz-count">QUESTION {questionIndex + 1} OF {questions.length}</div>
        <h3>{question.prompt}</h3>
        <div className="quick-quiz-options">
          {question.choices.map((choice, index) => {
            const isCorrect = selectedAnswer !== null && index === question.answer;
            const isWrongPick = selectedAnswer === index && index !== question.answer;
            return (
              <button
                className={`quick-quiz-option${isCorrect ? " correct" : ""}${isWrongPick ? " incorrect" : ""}`}
                key={choice}
                type="button"
                aria-pressed={selectedAnswer === index}
                disabled={selectedAnswer !== null}
                onClick={() => {
                  setSelectedAnswer(index);
                  if (index === question.answer) setScore(current => current + 1);
                }}
              >
                <span>{String.fromCharCode(65 + index)}</span>{choice}
              </button>
            );
          })}
        </div>

        {selectedAnswer !== null && (
          <div className={`quick-quiz-feedback ${answeredCorrectly ? "correct" : "incorrect"}`} role="status" aria-live="polite">
            <b>{answeredCorrectly ? "Correct." : `Not quite. The answer is ${question.choices[question.answer]}.`}</b>
            <span>{question.explanation}</span>
          </div>
        )}

        <footer className="quick-quiz-footer">
          <span>{questionIndex + 1} / {questions.length}</span>
          <button
            className="primary-button"
            type="button"
            disabled={selectedAnswer === null}
            onClick={() => {
              setSelectedAnswer(null);
              setQuestionIndex(current => current + 1);
            }}
          >
            {questionIndex === questions.length - 1 ? "See results" : "Next question"}
          </button>
        </footer>
      </div>
    </section>
  );
}
