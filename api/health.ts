export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    status: 'ok', 
    service: 'SMART HOSPITALITY API',
    timestamp: new Date().toISOString() 
  });
}
