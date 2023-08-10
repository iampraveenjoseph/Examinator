import { formatTimeDelta, cn } from "@/lib/utils";
import { differenceInSeconds } from "date-fns";
import { BarChart } from "lucide-react";
import React from "react";
import { buttonVariants } from "../ui/button";
import Link from "next/link";

type Props = {
  now: Date;
  timeStarted: Date;
  id: string;
};

const EndScreen = ({ now, timeStarted, id }: Props) => {
  return (
    <div className="absolute flex flex-col justify-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
      <div className="px-4 py-2 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
        You Completed in{" "}
        {formatTimeDelta(differenceInSeconds(now, timeStarted))}
      </div>
      <Link
        href={`/statistics/${id}`}
        className={cn(buttonVariants({ size: "lg" }), "mt-2")}
      >
        View Statistics
        <BarChart className="w-4 h-4 ml-2" />
      </Link>
    </div>
  );
};

export default EndScreen;
