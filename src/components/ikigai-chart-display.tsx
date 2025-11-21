import React from 'react';

import { IkigaiData } from "@/lib/types";

interface IkigaiChartDisplayProps {
  ikigaiData: IkigaiData;
}

export const IkigaiChartDisplay: React.FC<IkigaiChartDisplayProps> = ({ ikigaiData }) => {
  return (
    <div className="ikigai-chart-display p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-xl font-semibold mb-4">Your Ikigai</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium">What you love:</h3>
          <p>{ikigaiData.what_you_love}</p>
        </div>
        <div>
          <h3 className="font-medium">What you are good at:</h3>
          <p>{ikigaiData.what_you_are_good_at}</p>
        </div>
        <div>
          <h3 className="font-medium">What the world needs:</h3>
          <p>{ikigaiData.what_world_needs}</p>
        </div>
        <div>
          <h3 className="font-medium">What you can be paid for:</h3>
          <p>{ikigaiData.what_you_can_be_paid_for}</p>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-medium">Your Ikigai:</h3>
        <p className="text-lg font-bold text-primary">{ikigaiData.your_ikigai}</p>
      </div>
      <div className="mt-4">
        <h3 className="font-medium">Explanation:</h3>
        <p>{ikigaiData.explanation}</p>
      </div>
      <div className="mt-4">
        <h3 className="font-medium">Next Steps:</h3>
        <p>{ikigaiData.next_steps}</p>
      </div>
      {ikigaiData.strength_map && (
        <div className="mt-4">
          <h3 className="font-medium">Strength Map:</h3>
          <p><strong>Core Strengths:</strong> {ikigaiData.strength_map.core_strengths.join(", ")}</p>
          <p><strong>Supporting Skills:</strong> {ikigaiData.strength_map.supporting_skills.join(", ")}</p>
          <p><strong>Proof:</strong> {ikigaiData.strength_map.proof}</p>
        </div>
      )}
      {ikigaiData.weakness_map && (
        <div className="mt-4">
          <h3 className="font-medium">Weakness Map:</h3>
          <p><strong>Skill Gaps:</strong> {ikigaiData.weakness_map.skill_gaps.join(", ")}</p>
          <p><strong>Risks:</strong> {ikigaiData.weakness_map.risks.join(", ")}</p>
          <p><strong>Blocks:</strong> {ikigaiData.weakness_map.blocks.join(", ")}</p>
        </div>
      )}
    </div>
  );
};