
import { GoogleGenAI } from "@google/genai";
import type { ScheduleEntry } from '../types';

if (!process.env.API_KEY) {
    // In a real app, you'd want to handle this more gracefully.
    // For this environment, we assume the key is provided.
    console.warn("API_KEY environment variable not set for Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const analyzeSchedule = async (
    scheduleData: Record<string, (ScheduleEntry | null)[]>,
    employees: string[],
    weekDates: Date[]
): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const formattedDates = weekDates.map(d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));

    const prompt = `
        You are an expert HR and logistics manager for a tech support team. 
        Your task is to analyze a weekly work schedule and provide actionable insights.

        The team has the following roles: 'chef de prod', 'TL' (Team Lead), and 'mailer'. 
        It's critical to have at least one 'chef de prod' or 'TL' on duty during all work shifts for leadership coverage.

        Here is the schedule data for the week from ${formattedDates[0]} to ${formattedDates[6]}.
        The data is structured as a JSON object where keys are employee names and values are their schedules for the 7 days of the week. 'null' means the employee is unscheduled.

        Schedule Data:
        ${JSON.stringify(scheduleData, null, 2)}

        Please perform the following analysis and structure your response in Markdown:

        1.  **Overall Summary:** Briefly describe the week's schedule.
        2.  **Leadership Coverage:** For each day, verify if a 'chef de prod' or 'TL' is present during all scheduled shifts. Highlight any shifts or full days that lack leadership coverage. This is the most critical point.
        3.  **Staffing Levels:** Identify any days that seem overstaffed or understaffed. Mention specific shifts if possible (e.g., "Wednesday evening shift seems light").
        4.  **Workload Balance:** Point out if any employee seems overworked (e.g., has many consecutive shifts, or works all weekend). Also note employees with very few shifts.
        5.  **Positive Observations:** Mention anything that is well-scheduled (e.g., "Good coverage on Monday," "Weekend shifts are fairly distributed").
        
        Provide a concise, clear, and professional analysis.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        if (response.text) {
            return response.text;
        } else {
            return "The AI analysis returned an empty response. Please check the model and prompt.";
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get analysis from AI. Please check the API key and network connection.");
    }
};
