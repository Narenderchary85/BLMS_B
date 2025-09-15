import express from "express"
import mongoose from "mongoose"
import AuthRoute from "./Auth/AuthUser.js"
import LeadRoute from "./Leads/LeadRoute.js"
import cors from "cors"
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

const app = express();
const port = 1000;

dotenv.config();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
  }).then(() => console.log('DB connected'));

app.use("/auth",AuthRoute)
app.use("/leads",LeadRoute)

app.listen(port, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
  