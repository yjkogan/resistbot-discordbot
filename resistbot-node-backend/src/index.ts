import express from "express";
import {
  handleIncomingDM,
  handleQuickResponse,
  handleRapidProResponse,
} from "./dmHandlers";
import logger from "morgan";

var app = express();
const port = process.env.BACKEND_PORT || 5555;

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* GET home page. */
app.get("/healthcheck", function (req: express.Request, res: express.Response) {
  const healthcheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
  };
  try {
    res.send(healthcheck);
  } catch (e) {
    res.status(503).send();
  }
});

app.post(
  "/incoming-dm",
  function (req: express.Request, res: express.Response) {
    handleIncomingDM(req.body);
    res.send(202);
  },
);

app.post(
  "/incoming-interaction",
  function (req: express.Request, res: express.Response) {
    handleQuickResponse(req.body);
    res.send(202);
  },
);

app.post(
  "/rp-response",
  function (req: express.Request, res: express.Response) {
    handleRapidProResponse(req.body);
    res.send(202);
  },
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
