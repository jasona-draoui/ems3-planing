
import { GoogleGenAI } from "@google/genai";
import { Firestore } from 'firebase/firestore';
import { addNotification } from './firebaseService';
import type { ScheduleEntry } from '../types';
import type { Language } from '../translations';

// Initialized Gemini client using recommended pattern.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface NotificationPayload {
    actionType: 'add' | 'edit' | 'delete';
    shift: Partial<ScheduleEntry>;
    previousShift?: Partial<ScheduleEntry>;
}

export const notifyScheduleChange = async (db: Firestore, payload: NotificationPayload, language: Language = 'en') => {
    const { actionType, shift, previousShift } = payload;
    // Basic text task, gemini-3-flash-preview is suitable.
    const model = 'gemini-3-flash-preview';

    const dateStr = shift.shiftDate ? new Date(shift.shiftDate).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    }) : 'unspecified date';

    const getActionDescription = () => {
        if (language === 'fr') {
            if (actionType === 'add') return `a ajouté une nouvelle entrée (${shift.type})`;
            if (actionType === 'edit') return `a modifié une entrée (${shift.type})`;
            return `a supprimé une entrée (${shift.type})`;
        }
        if (actionType === 'add') return `added a new ${shift.type} entry`;
        if (actionType === 'edit') return `modified a ${shift.type} entry`;
        return `deleted a ${shift.type} entry`;
    };

    const prompt = `
        You are an automated notification assistant for a corporate scheduling system.
        Generate a professional email notification for a schedule change.
        IMPORTANT: The subject and body must be in ${language === 'fr' ? 'French' : 'English'}.

        Change Details:
        - Employee: ${shift.employeeName}
        - Action: ${getActionDescription()}
        - Date: ${dateStr}
        ${shift.type === 'Shift' ? `- New Time: ${shift.shiftStart} to ${shift.shiftEnd}` : ''}
        ${previousShift ? `- Previous State: ${previousShift.type} ${previousShift.shiftStart ? `(${previousShift.shiftStart}-${previousShift.shiftEnd})` : ''}` : ''}

        Output should be in JSON format:
        {
            "subject": "A concise, clear email subject line in ${language === 'fr' ? 'French' : 'English'}",
            "body": "A professional email body summary in ${language === 'fr' ? 'French' : 'English'} (max 3 sentences)"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        // Use the .text property directly.
        const draft = JSON.parse(response.text || '{"subject": "Schedule Update", "body": "The schedule has been updated."}');
        
        // Mock email sending (in a real app, you'd use SendGrid/EmailJS here)
        console.group('%c EMAIL NOTIFICATION SENT ', 'background: #0891b2; color: white; font-weight: bold;');
        console.log('To: Team Distribution List');
        console.log('Subject:', draft.subject);
        console.log('Body:', draft.body);
        console.groupEnd();

        // Store log in Firestore
        await addNotification(db, {
            type: actionType,
            message: `${shift.employeeName} - ${getActionDescription()} for ${dateStr}`,
            emailDraft: draft
        });

        return draft;
    } catch (error) {
        console.error("Failed to generate/send notification:", error);
        return null;
    }
};
