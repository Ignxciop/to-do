import * as taskSummaryService from "../services/taskSummary.js";

export const getTasksSummaryController = async (req, res) => {
    try {
        const userId = req.user.id;
        const summary = await taskSummaryService.getTasksSummary(userId);
        res.json({ summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
