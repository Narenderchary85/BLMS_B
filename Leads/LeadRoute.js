import express from "express"
import LeadModel from "../Model/LeadModel.js";
import { validateToken } from "../middleware/validation.js";

const router=express.Router();

router.post("/addlead", validateToken ,async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        email,
        phone,
        company,
        city,
        state,
        source,
        status,
        score,
        lead_value,
        last_activity_at,
        is_qualified,
      } = req.body;
  
      if (!first_name || !last_name || !email || !phone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existingLead = await LeadModel.findOne({ email });
      if (existingLead) {
        return res.status(400).json({ message: "Lead already exists with this email" });
      }
  
      const newLead = new LeadModel({
        first_name,
        last_name,
        email,
        phone,
        company,
        city,
        state,
        source,
        status,
        score,
        lead_value,
        last_activity_at,
        is_qualified,
      });
  
      const savedLead = await newLead.save();
  
      res.status(201).json({
        message: "Lead added successfully",
        success: true,
        lead: savedLead,
      });
    } catch (err) {
      console.error("Add Lead Error:", err);
      res.status(500).json({ message: "Failed to add lead", error: err.message });
    }
  });

  router.get("/getleads", validateToken ,async (req, res) => {
    try {
      let { page = 1, limit = 20 } = req.query;
  
      page = parseInt(page);
      limit = Math.min(parseInt(limit), 100); // max 100
  
      const skip = (page - 1) * limit;
  
      // Fetch paginated leads
      const leads = await LeadModel.find()
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);
  
      // Total count of leads
      const total = await LeadModel.countDocuments();
      const totalPages = Math.ceil(total / limit);
  
      res.status(200).json({
        success: true,
        data: leads,
        page,
        limit,
        total,
        totalPages,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch leads", error: err.message });
    }
  });
  

  router.get("/getlead/:id", validateToken , async (req, res) => {
    try {
      const lead = await LeadModel.findById(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(200).json({ success: true, lead });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch lead", error: err.message });
    }
  });

  router.put("/editlead/:id",validateToken, async (req, res) => {
    try {
      const updatedLead = await LeadModel.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updated_at: Date.now() },
        { new: true, runValidators: true }
      );
  
      if (!updatedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
  
      res.status(200).json({
        message: "Lead updated successfully",
        success: true,
        lead: updatedLead,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to update lead", error: err.message });
    }
  });

  router.delete("/deletelead/:id",validateToken, async (req, res) => {
    try {
      const deletedLead = await LeadModel.findByIdAndDelete(req.params.id);
  
      if (!deletedLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
  
      res.status(200).json({
        message: "Lead deleted successfully",
        success: true,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete lead", error: err.message });
    }
  });


 // backend/routes/leads.js

router.get("/search",validateToken, async (req, res) => {
  try {
    const {
      q,
      email,
      email_contains,
      company,
      company_contains,
      city,
      city_contains,
      status,
      status_in,
      source,
      source_in,
      score,
      score_gt,
      score_lt,
      score_between,
      lead_value,
      lead_value_gt,
      lead_value_lt,
      lead_value_between,
      created_on,
      created_before,
      created_after,
      created_between,
      last_on,
      last_before,
      last_after,
      last_between,
      is_qualified,
    } = req.query;

    const filter = {};

    // ✅ Free text search across names
    if (q) {
      filter.$or = [
        { first_name: { $regex: q, $options: "i" } },
        { last_name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } }
      ];
    }
    

    // existing filters (example: city, email, score etc.)
    if (city) filter.city = city;
    if (city_contains) filter.city = { $regex: city_contains, $options: "i" };

    if (email) filter.email = email;
    if (email_contains) filter.email = { $regex: email_contains, $options: "i" };

    if (company) filter.company = company;
    if (company_contains) filter.company = { $regex: company_contains, $options: "i" };

    // Enum filters
    if (status) filter.status = status;
    if (status_in) filter.status = { $in: status_in.split(",") };

    if (source) filter.source = source;
    if (source_in) filter.source = { $in: source_in.split(",") };

    // Numbers
    if (score) filter.score = Number(score);
    if (score_gt) filter.score = { ...filter.score, $gt: Number(score_gt) };
    if (score_lt) filter.score = { ...filter.score, $lt: Number(score_lt) };
    if (score_between) {
      const [min, max] = score_between.split(",").map(Number);
      filter.score = { $gte: min, $lte: max };
    }

    // Dates
    if (created_on) filter.created_at = new Date(created_on);
    if (created_before) filter.created_at = { $lt: new Date(created_before) };
    if (created_after) filter.created_at = { $gt: new Date(created_after) };
    if (created_between) {
      const [start, end] = created_between.split(",");
      filter.created_at = { $gte: new Date(start), $lte: new Date(end) };
    }

    // Boolean
    if (is_qualified) filter.is_qualified = is_qualified === "true";

    const leads = await LeadModel.find(filter).sort({ created_at: -1 });

    res.status(200).json({ success: true, leads });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ success: false, message: "Search failed", error: err.message });
  }
});

  
  

export default router;