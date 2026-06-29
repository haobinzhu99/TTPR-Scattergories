// @ts-nocheck

import "dotenv/config";
import express from "express";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "@prisma/client";
import { PrismaClient } from "./generated/prisma/client.js";

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});
const port = 3000;
//letters for the game
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

//topics for the game
const topics = ["Animal", "Country", "Food", "Movie", "Sport"];

function randomLetter() {
  return letters[Math.floor(Math.random() * letters.length)];
}

function randomTopic() {
  return topics[Math.floor(Math.random() * topics.length)];
}

app.post("/games", async (req, res) => {
  const { roomId } = req.body;

  //if no roomid was provided, return error 400
  if (!roomId) {
    return res.status(400).json({
      error: "A RoomId is required",
    });
  }

  try {
    const game = await prisma.game.create({
      data: {
        roomId,
        letter: randomLetter(),
        topic: randomTopic(),
      },
    });

    return res.status(201).json(game);
    // if prisma returns p2002 (non unique) then output https error 409 (valid entry but conflicts with params)
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Room code already exists",
      });
    }
    //fallback error that catches everything
    return res.status(500).json({
      error: "Server error",
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
        topic: true,
      },
    });

    res.json(games);
    // shows whats wrong
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message,
    });
  }
});

//work on post answer func
app.post("/answers", async (req, res) => {
  const { gameId, username, answer } = req.body;
  // checks for gameid, username, answers
  if (!gameId || !username || !answer) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    const game = await prisma.game.findUnique({
      where: {
        id: Number(gameId),
      },
    });

    if (!game) {
      return res.status(404).json({
        error: "Game not found",
      });
    }
    // normalizes the answers to allow checking for duplicates
    const normalizedAnswer = answer.trim().toLowerCase();

    const newAnswer = await prisma.answer.create({
      data: {
        username,
        answer,
        normalizedAnswer,
        gameId: Number(gameId),
      },
    });

    return res.status(201).json(newAnswer);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "That answer has already been submitted for this game",
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
