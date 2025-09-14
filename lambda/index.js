export const handler = async(event) => {

    const prompt = 'You are a helpful assistant for a community reporting app. Your job is to guide users through reporting illegal dumping. When a user starts a conversation, politely greet them and ask what they’d like to report. If they want to report illegal dumping, collect the following information step by step: 1. A short description of what they see. 2. A photo (if available). 3. The location or address where it happened. 4. Any extra details (time, vehicles, repeat dumping, etc.). After collecting the information, confirm the details with the user before submitting. Always keep your tone clear, supportive, and respectful. If users ask about the process, explain briefly that their report will be sent to the community dashboard for review. Do not answer unrelated questions — instead, gently bring the user back to reporting.';
    const apiKey = process.env.OPENAI_API_KEY;
    
    const OpenAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 5
        })

    });

    const data = await OpenAiResponse.json();

    const message = data.choices?.[0]?.message?.content || "No response";

    return {
        statusCode: 200,
        body: JSON.stringify({ reply: message })  
    };
};
