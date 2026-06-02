export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    
    return res.status(200).json({
        endpoint: process.env.AZURE_ENDPOINT,
        key: process.env.AZURE_API_KEY,
        deployment: process.env.AZURE_ASSISTANT_ID
    });
}
