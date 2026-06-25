import express from "express";
import { PrismaClient } from "@prisma/client";
const app = express();
const prisma = new PrismaClient();
const port = 3000;
app.use(express.json());
app.use(express.static("public"))

//letters for the game
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

//topics for the game
const topics = [
  "Animal",
  "Country",
  "Food",
  "Movie",
  "Sport"
];

function randomLetter() {
  return letters[Math.floor(Math.random() * letters.length)];
}

function randomTopic() {
  return topics[Math.floor(Math.random() * topics.length)];
}

app.post("/games", async (req, res) => {
    const { roomId } = req.body;
    
    //if no roomid was provided, return error 400
    if (!roomID) {
        return res.status(400).json({
            error: "A RoomId is required"
        });
    }
    
    try {
        const game = await prisma.game.create({
    data: {
        roomId,
        letter: randomLetter(),
        topic: randomTopic()
    }
});

        return res.status(201).json(game);
    // if prisma returns p2002 (non unique) then output https error 409 (valid entry but conflicts with params)
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                error: "Room code already exists"
            });
        }
    //fallback error that catches everything
        return res.status(500).json({
            error: "Server error"
        });
    }
});

// grabbing all the info from the prisma server ie: roomId, letter,topic
app.get("/games", async (req, res) => {
    try {
        const games = await prisma.game.findMany({
            select: {
                roomId: true,
                letter: true,
                topic: true
            }
        });

        res.json(games);
    } catch (error) {
        res.status(500).json({
            error: "Server error"
        });
    }
});

//work on post answer func


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});