"use client";
import React from "react";
import { Game, Question } from "@prisma/client";
import { BarChart, ChevronRight, Link, Loader2, Timer } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button, buttonVariants } from "../ui/button";
import MCQCounter from "./MCQCounter";
import { z } from "zod";
import { checkAnswerSchema, endGameSchema } from "@/schemas/questions";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useToast } from "../ui/use-toast";
import { cn, formatTimeDelta } from "@/lib/utils";
import { differenceInSeconds } from "date-fns";
import EndScreen from "./EndScreen";

type Props = {
  game: Game & { questions: Pick<Question, "id" | "options" | "question">[] };
};

const MCQ = ({ game }: Props) => {
  const [hasEnded, setHasEnded] = React.useState(false);
  const [stats, setStats] = React.useState({
    correct_answers: 0,
    wrong_answers: 0,
  });

  const [now, setNow] = React.useState(new Date());

  const [selectedChoice, setSelectedChoice] = React.useState<number>(0);
  const [questionIndex, setQuestionIndex] = React.useState(0);

  const { toast } = useToast();

  const currentQuestion = React.useMemo(() => {
    return game.questions[questionIndex];
  }, [game.questions, questionIndex]);

  const options = React.useMemo(() => {
    if (!currentQuestion) return [];
    if (!currentQuestion.options) return [];
    return JSON.parse(currentQuestion.options as string) as string[];
  }, [currentQuestion]);

  const { mutate: checkAnswer, isLoading: isChecking } = useMutation({
    mutationFn: async () => {
      const payload: z.infer<typeof checkAnswerSchema> = {
        questionId: currentQuestion.id,
        userInput: options[selectedChoice],
      };
      const response = await axios.post(`/api/checkAnswer`, payload);
      return response.data;
    },
  });

  const { mutate: endGame } = useMutation({
    mutationFn: async () => {
      const payload: z.infer<typeof endGameSchema> = {
        gameId: game.id,
      };
      const response = await axios.post(`/api/endGame`, payload);
      return response.data;
    },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!hasEnded) {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded]);
  const handleNext = React.useCallback(() => {
    checkAnswer(undefined, {
      onSuccess: ({ isCorrect }) => {
        if (isCorrect) {
          setStats((stats) => ({
            ...stats,
            correct_answers: stats.correct_answers + 1,
          }));
          toast({
            title: "Correct",
            description: "You got it right!",
            variant: "success",
          });
        } else {
          setStats((stats) => ({
            ...stats,
            wrong_answers: stats.wrong_answers + 1,
          }));
          toast({
            title: "Incorrect",
            description: "You got it wrong!",
            variant: "destructive",
          });
        }
        if (questionIndex === game.questions.length - 1) {
          endGame();
          setHasEnded(true);
          return;
        }
        setQuestionIndex((questionIndex) => questionIndex + 1);
      },
    });
  }, [checkAnswer, questionIndex, game.questions.length, toast, endGame]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      if (key === "1") {
        setSelectedChoice(0);
      } else if (key === "2") {
        setSelectedChoice(1);
      } else if (key === "3") {
        setSelectedChoice(2);
      } else if (key === "4") {
        setSelectedChoice(3);
      } else if (key === "Enter") {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext]);
  if (hasEnded) {
    return (
      <EndScreen now={now} timeStarted={game.timeStarted} id={game.id}/>
    );
  }
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw]">
      <div className="flex flex-row justify-between ">
        {/* topic */}
        <div className="flex flex-col">
          <p>
            <span className="text-slate-400 mr-2">Topic</span>
            <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
              {game.topic}
            </span>
          </p>
          <div className="flex self-start mt-3 text-slate-400">
            <Timer className="mr-2" />
            <span>{formatTimeDelta(differenceInSeconds(now, game.timeStarted))}</span>
          </div>
        </div>
        <MCQCounter {...stats} />
      </div>

      <Card className="w-full mt-4">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-400">
              {game.questions.length}
            </div>
          </CardTitle>
          <CardDescription className="flex-grow text-lg">
            {currentQuestion?.question}
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col items-center justify-center w-[90%] mt-4 mx-auto">
          {options.map((option, index) => {
            return (
              <Button
                key={option}
                variant={selectedChoice === index ? "default" : "outline"}
                className="justify-start w-full py-8 mb-4"
                onClick={() => setSelectedChoice(index)}
              >
                <div className="flex items-center justify-start">
                  <div className="p-2 px-3 mr-5 border rounded-md">
                    {index + 1}
                  </div>
                  <div className="text-start">{option}</div>
                </div>
              </Button>
            );
          })}
          <Button
            variant="default"
            className="my-2"
            size="lg"
            disabled={isChecking || hasEnded}
            onClick={() => {
              handleNext();
            }}
          >
            {isChecking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MCQ;
