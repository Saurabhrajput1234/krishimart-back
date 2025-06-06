const express = require("express");
const axios = require("axios");
const fs = require("fs");
const Chat = require("../model/Chat");
const FAQ = require("../model/faq");

const router = express.Router();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Load krishimart predefined information
const krishimartInfo = JSON.parse(fs.readFileSync("./data/krishimart_info.json", "utf8"));

// Generate AI prompt with krishimart context
const generatePrompt = (userMessage) => {
    return `
You are a chatbot representing "krishimart", an e-commerce platform. Use the following information to answer the question accurately:

Name: ${krishimartInfo.name}
Description: ${krishimartInfo.description}
Features: ${krishimartInfo.features.join(", ")}
Return Policy: ${krishimartInfo.return_policy}
Payment Methods: ${krishimartInfo.payment_methods}
Customer Support: ${krishimartInfo.customer_support}

User Question: "${userMessage}"
Answer:
`;
};

router.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required!" });
    }

    try {
        let faqResponse = null;
        let aiResponse = null;

        const cleanMessage = message.trim().replace(/['"]+/g, "");

        // Search in FAQ
        const faq = await FAQ.findOne({
            question: { $regex: new RegExp(cleanMessage, "i") }
        });

        if (faq) {
            faqResponse = faq.answer;
        } else {
            const aiPrompt = generatePrompt(message);

            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: "openai/gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "Provide short and concise answers within 2 sentences." },
                        { role: "user", content: aiPrompt }
                    ]
                },
                {
                    headers: {
                        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            aiResponse = response.data.choices?.[0]?.message?.content || "Sorry, I couldn't understand that.";
        }

        // Save the chat to DB
        const chat = new Chat({
            userMessage: message,
            botResponse: faqResponse || aiResponse
        });
        await chat.save();

        res.json({ faqResponse, aiResponse });
    } catch (error) {
        console.error("Error processing chatbot request:", error?.response?.data || error.message);
        res.status(500).json({ error: "Failed to process chatbot request." });
    }
});

module.exports = router;
