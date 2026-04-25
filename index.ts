import cookieParser from "cookie-parser";
import "dotenv/config";
import express from "express";

const app=express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health",(req,res)=>{
    res.status(200).json({message:"health route is working"});
})

app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`);
})