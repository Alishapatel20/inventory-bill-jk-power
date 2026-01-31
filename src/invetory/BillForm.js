import React, { useRef, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { toast, Toaster } from "react-hot-toast";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PdfTemplate from "./PdfTemplate";
import {
  Modal,
  Button,
  Form as BootstrapForm,
  Row,
  Col,
  Dropdown,
  Table,
  Accordion,
  Spinner,
  ButtonGroup,
  ToggleButton,
} from "react-bootstrap";
import { Pencil, X, Plus, Save, Eye, Trash } from "lucide-react";
import "./BillForm.css";

const parseQuantity = (qty) => {
  if (!qty) return 0;
  const match = qty.toString().match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : 0;
};

const UpperCaseField = ({ name, placeholder, as = "input", type = "text", ...props }) => (
  <Field name={name}>
    {({ field, form }) => {
      const Component = as;
      return (
        <Component
          {...field}
          {...props}
          type={as === "input" ? type : undefined}
          placeholder={placeholder}
          className="form-control"
          value={field.value || ""}
          onChange={(e) => {
            form.setFieldValue(name, e.target.value.toUpperCase());
          }}
        />
      );
    }}
  </Field>
);

// Component to watch form changes and update local state
const FormObserver = ({ onChange }) => {
  const { values } = useFormikContext();
  useEffect(() => {
    onChange(values);
  }, [values, onChange]);
  return null;
};

const BillForm = () => {
  const pdfRef = useRef(null);
  const nameInputRef = useRef(null); // Ref for scrolling
  const [formValues, setFormValues] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [activeName, setActiveName] = useState("");
  const [allProjects, setAllProjects] = useState([]); // ✅ Multiple project list
  const [isPdfReady, setIsPdfReady] = useState(false);
  const [isPdfMounted, setIsPdfMounted] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null); // Track which project is being edited in Supabase
  const [view, setView] = useState("dashboard"); // 'dashboard' | 'form'
  const [isSaving, setIsSaving] = useState(false); // Track save operation
  const [pdfFormat, setPdfFormat] = useState("horizontal"); // 'vertical' | 'horizontal'

  // Modal State for Project Name/Number
  const [modalProjectName, setModalProjectName] = useState("");
  const [modalProjectNumber, setModalProjectNumber] = useState("");

  const [projectDetails, setProjectDetails] = useState({
    projectName: "",
    projectNumber: "",
    entries: [],
  });

  // Track form metadata (Work Order, PO, etc.) separately to save with project
  const [formMetadata, setFormMetadata] = useState({});

  const [tempName, setTempName] = useState("");
  const [selectedDescriptions, setSelectedDescriptions] = useState([]);

  const descriptionOptions = [
    { id: 1, itemCode: "9925000001", desc: "Excavation of cable trench 400mm width x 1200mm depth" },
    { id: 2, itemCode: "9925000002", desc: "Excavation of cable trench 600mm width x 1200mm depth" },
    { id: 3, itemCode: "9925000004", desc: "Length of cable in trench complete" },
    { id: 4, itemCode: "9925000007", desc: "Horizontal drilling using Auger machine & putting of HDPE pipe & laying of cable" },
    { id: 5, itemCode: "9925000009", desc: "Green color 110mm HDPE pipe" },
    { id: 6, itemCode: "9925000011", desc: "Concrete stone route marker" },
    { id: 7, itemCode: "9925000014", desc: "Cable rising on DP structure (cleate)" },
    { id: 8, itemCode: "9925000015", desc: "HDPE Guard pipe" },
    { id: 9, itemCode: "9925000016", desc: "Pipe type earthing" },
    { id: 10, itemCode: "9925000018", desc: "11KV x 185 sq.mm Outdoor end terminations" },
    { id: 11, itemCode: "9925000019", desc: "11KV x 185 sq.mm Indoor end terminations" },
    { id: 12, itemCode: "9925000021", desc: "11KV x 185 sq.mm Straight through joint kit" },
    { id: 13, itemCode: "9925000023", desc: "Pits for straight through joints" },
    { id: 14, itemCode: "9925000025", desc: "Testing of cable at various points" },
    { id: 15, itemCode: "9925000026", desc: "Preparation and submission of layout drawings" },
    { id: 16, itemCode: "9925000047", desc: "Cable in open or readymade trench" },
    { id: 17, itemCode: "9925000047", desc: "11KV cable loop at transformer & DP" },
    { id: 18, itemCode: "9925000010", desc: "Cable rising at DP structure" }
  ];

  const defaultInitialValues = {
    name: "",
    dateOfCommunication: "",
    workOrderNumber: "",
    poNumber: "",
    dueDateOfCommencement: "",
    jwoNumber: "",
    subDivision: "",
    dueDateOfCompletionOfWork: "",
    dateOfCompletion: "",
    nameOfWork: "",
    timeLimitAsPerSubWorkOrder: "",
    nameOfContractor: "J .K. Electrical Surat",
  };

  // Use state for initial values to allow population when editing
  const [initialValues, setInitialValues] = useState(defaultInitialValues);

  // === SUPABASE FETCH ===
  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching projects:", error);
        return;
      }

      // Map Supabase data to app structure
      const formatted = (data || []).map((row) => {
        // Handle both old format (array) and new format (object)
        let entries = [];
        let metadata = {};

        if (Array.isArray(row.data)) {
          entries = row.data;
        } else if (row.data && typeof row.data === 'object') {
          entries = row.data.entries || [];
          metadata = row.data.formDetails || {};
        }

        // Patch old item codes to new ones
        if (entries) {
          entries.forEach(entry => {
            if (entry.descriptions) {
              entry.descriptions.forEach(d => {
                if (d.itemCode === "9925000047" && d.desc === "Cable rising at DP structure") {
                  d.itemCode = "9925000010";
                }
                // Patch old description for item 9925000014
                if (d.itemCode === "9925000014" && d.desc === "Cable rising on DP structure") {
                  d.desc = "Cable rising on DP structure (cleate)";
                }
              });
            }
          });
        }

        return {
          id: row.id,
          projectName: row.name,
          projectNumber: row.project_number,
          entries: entries,
          formDetails: metadata,
        };
      });

      setAllProjects(formatted);
    } catch (err) {
      console.error("Unexpected error fetching projects:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // === PDF GENERATE ===
  const generatePDF = async (values) => {
    return new Promise((resolve) => {
      // Construct the current project object to allow downloading only the current one
      const currentProject = {
        id: editingProjectId || "new-temp-id",
        projectName: modalProjectName || projectDetails.projectName || "New Project",
        projectNumber: modalProjectNumber || projectDetails.projectNumber || "",
        entries: projectDetails.entries,
      };

      // FOR PDF: We ONLY want the current project being edited/created. 
      // Do NOT merge with allProjects. 
      const pdfProjects = [currentProject];

      // Pass ALL projects to the PDF template with format
      const fullValues = { ...values, allProjects: pdfProjects, pdfFormat };
      setFormValues(fullValues);

      // Make PdfTemplate render
      setIsPdfReady(true);

      // Give React a moment to render the view
      setTimeout(() => {
        const input = pdfRef.current;
        if (!input) {
          toast.error("PDF content not ready!");
          setIsPdfReady(false);
          resolve();
          return;
        }

        // Configure PDF based on selected format
        const isHorizontal = pdfFormat === "horizontal";
        const doc = new jsPDF({
          orientation: isHorizontal ? "l" : "p", // landscape or portrait
          unit: "pt",
          format: "a4",
        });

        // Use the new .html() method (which uses html2canvas internally)
        // to handle pagination automatically.
        doc.html(input, {
          callback: function (doc) {
            doc.save(`Inventory_Bill_${values.name || "document"}.pdf`);
            setIsPdfReady(false);
            resolve();
          },
          x: 20, // Left margin (pt)
          y: 20, // Top margin (pt)
          width: isHorizontal ? 800 : 540, // Landscape: 800pt, Portrait: 540pt
          windowWidth: isHorizontal ? 1100 : 750, // Landscape: 1100px, Portrait: 750px
          margin: [20, 20, 20, 20],
          autoPaging: 'text',
          html2canvas: {
            scale: isHorizontal ? 0.73 : 0.74, // Adjust scale based on format
            useCORS: true,
            logging: true,
            letterRendering: true,
          }
        });
      }, 500);
    });
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    await generatePDF(values);
    setSubmitting(false);
    toast.success("PDF Generated Successfully!");
  };

  const toggleDescription = (item) => {
    const exists = selectedDescriptions.find((d) => d.id === item.id);

    if (exists) {
      setSelectedDescriptions((prev) => prev.filter((d) => d.id !== item.id));
    } else {
      setSelectedDescriptions((prev) => [
        ...prev,
        {
          id: item.id,            // use unique id to track selection
          itemCode: item.itemCode,
          desc: item.desc,
          unit: "Meter",          // Default unit
          mainCableQty: "",
          spareCableQty: ""
        }
      ]);
    }
  };


  const handleCableChange = (desc, field, value) => {
    // Force uppercase for text inputs only (qty fields)
    const finalValue = (field === "mainCableQty" || field === "spareCableQty")
      ? value.toUpperCase()
      : value;

    setSelectedDescriptions((prev) =>
      prev.map((d) => (d.desc === desc ? { ...d, [field]: finalValue } : d))
    );
  };

  const handleAddOrUpdateEntry = () => {
    const name = tempName.trim();

    if (!name) return toast.error("Please enter a name");
    if (selectedDescriptions.length === 0)
      return toast.error("Please select at least one description");

    setProjectDetails((prev) => {
      const entries = [...prev.entries];
      if (editingIndex !== null) {
        entries[editingIndex] = { name, descriptions: [...selectedDescriptions] };
      } else {
        const existing = entries.find((e) => e.name === name);
        if (existing) {
          selectedDescriptions.forEach((newDesc) => {
            const found = existing.descriptions.find((d) => d.desc === newDesc.desc);
            if (found) {
              found.unit = newDesc.unit;
              found.mainCableQty = newDesc.mainCableQty;
              found.spareCableQty = newDesc.spareCableQty;
            } else {
              existing.descriptions.push(newDesc);
            }
          });
        } else {
          entries.push({ name, descriptions: [...selectedDescriptions] });
        }
      }
      return { ...prev, entries };
    });

    setTempName("");
    setSelectedDescriptions([]);
    setEditingIndex(null);
  };

  const handleEditEntry = (index) => {
    const entry = projectDetails.entries[index];
    setEditingIndex(index);
    setTempName(entry.name);
    setSelectedDescriptions(entry.descriptions);
    setActiveName(entry.name);
    setShowModal(true);

    // Scroll to the input field
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        nameInputRef.current.focus();
      }
    }, 300);
  };

  const handleRemoveName = (index) => {
    setProjectDetails((prev) => {
      const updated = [...prev.entries];
      updated.splice(index, 1);
      return { ...prev, entries: updated };
    });
  };

  const handleRemoveDescription = (name, desc) => {
    setProjectDetails((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) =>
        entry.name === name
          ? {
            ...entry,
            descriptions: entry.descriptions.filter((d) => d.desc !== desc),
          }
          : entry
      ),
    }));
  };

  const handleProjectSave = async () => {
    const pName = modalProjectName.trim();
    const pNumber = modalProjectNumber.trim();

    if (!pName || !pNumber) {
      toast.error("Please fill both Project Name and Project Number");
      return;
    }

    if (projectDetails.entries.length === 0) {
      toast.error("Please add at least one entry before saving.");
      return;
    }

    // Prepare payload with entries AND form details
    const payload = {
      name: pName,
      project_number: pNumber,
      data: {
        entries: projectDetails.entries,
        formDetails: formMetadata // Save current form fields
      },
    };

    setIsSaving(true); // Start loader

    try {
      if (editingProjectId) {
        // Update existing project
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", editingProjectId);

        if (error) throw error;
        toast.success("Project updated successfully!");
      } else {
        // Insert new project
        const { error } = await supabase.from("projects").insert([payload]);

        if (error) throw error;
        toast.success("Project saved to database!");
      }

      // Refresh list
      await fetchProjects();

      // Reset
      setProjectDetails({ projectName: "", projectNumber: "", entries: [] });
      setModalProjectName("");
      setModalProjectNumber("");
      setEditingProjectId(null);
      setFormMetadata({}); // Clear metadata
      setInitialValues(defaultInitialValues); // Reset form
      setShowModal(false);
      setView("dashboard"); // Go back to dashboard on save
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Error saving project: " + error.message);
    } finally {
      setIsSaving(false); // Stop loader
    }
  };

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState(null);

  const handleDeleteProject = (id) => {
    setDeleteProjectId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!deleteProjectId) return;

    const toastId = toast.loading("Deleting project...");
    try {
      const { error } = await supabase.from("projects").delete().eq("id", deleteProjectId);
      if (error) throw error;
      await fetchProjects();
      toast.success("Project deleted successfully!", { id: toastId });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Error deleting project: " + error.message, { id: toastId });
    } finally {
      setShowDeleteModal(false);
      setDeleteProjectId(null);
    }
  };

  // === NAVIGATION HANDLERS ===
  const handleAddNewProject = () => {
    // Reset form for new entry
    setFormValues(null);
    setProjectDetails({ projectName: "", projectNumber: "", entries: [] });
    // Reset Metadata & Form
    setFormMetadata({});
    setInitialValues(defaultInitialValues);

    setModalProjectName("");
    setModalProjectNumber("");
    setEditingProjectId(null);
    setView("form");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
  };

  const handleEditProject = (project) => {
    // Load project data into state for editing
    setProjectDetails({
      projectName: project.projectName, // Ensure match with supbase column mapping
      projectNumber: project.projectNumber,
      entries: project.entries,
    });

    // Load metadata into state
    if (project.formDetails) {
      setFormMetadata(project.formDetails);
      setInitialValues({ ...defaultInitialValues, ...project.formDetails });
    } else {
      setFormMetadata({});
      setInitialValues(defaultInitialValues);
    }

    setModalProjectName(project.projectName);
    setModalProjectNumber(project.projectNumber);
    setEditingProjectId(project.id);
    setView("form");
  };

  return (
    <div style={{ position: "relative" }}>
      <Toaster position="top-right" reverseOrder={false} />
      <div style={{ position: "relative", zIndex: 5, backgroundColor: "#ffffff", minHeight: "100vh", padding: "1px 0" }}>
        <div className="container my-4">

          {/* === DASHBOARD VIEW === */}
          {view === "dashboard" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0 fw-bold text-primary">📑 Project Dashboard</h2>
                <Button variant="primary" onClick={handleAddNewProject} className="shadow-sm">
                  <Plus size={18} className="me-1" /> Add New Project
                </Button>
              </div>

              {allProjects.length === 0 ? (
                <div className="text-center p-5 bg-light rounded border border-dashed">
                  <h4 className="text-muted">No projects found</h4>
                  <p className="text-secondary">Click "Add New Project" to get started.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {allProjects.map((project) => (
                    <div key={project.id} className="col-md-6 col-lg-4">
                      <div className="card h-100 shadow-sm border-0 hover-shadow">
                        <div className="card-body">
                          <h5 className="card-title fw-bold text-dark">{project.projectName}</h5>
                          <h6 className="card-subtitle mb-2 text-muted">{project.projectNumber}</h6>
                          <p className="card-text text-secondary">{project.entries.length} Location Entries</p>
                        </div>
                        <div className="card-footer bg-white border-0 d-flex justify-content-between">
                          <small className="text-muted">ID: {project.id.slice(0, 8)}...</small>
                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEditProject(project)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* === FORM VIEW === */}
          {view === "form" && (
            <div>
              <div className="d-flex align-items-center mb-4">
                <Button variant="outline-secondary" className="me-3 border-0" onClick={handleBackToDashboard}>
                  &larr; Back to Dashboard
                </Button>
                <h3 className="mb-0 fw-bold">{editingProjectId ? `Edit Project: ${projectDetails.projectName}` : "New Bill Form"}</h3>
              </div>

              {/* ===== Main Form ===== */}
              <Formik
                enableReinitialize={true} // Allow initialValues to update when state changes
                initialValues={initialValues}
                // validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <>
                    <FormObserver onChange={setFormMetadata} />
                    {/* Reuse existing loader overlay style for consistency */}
                    {(isSubmitting || isSaving) && (
                      <div className="loader-overlay">
                        <Spinner animation="border" variant="light" style={{ width: "3rem", height: "3rem" }} />
                        <h4>{isSaving ? "Saving Project..." : "Generating PDF..."}</h4>
                      </div>
                    )}
                    <Form className="p-4 border rounded bg-white shadow-sm">
                      <Row>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>Name:</label>
                            <UpperCaseField name="name" />
                            <ErrorMessage name="name" component="div" className="text-danger" />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>Date of Communication:</label>
                            <Field type="date" name="dateOfCommunication" className="form-control" />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>Work Order Number:</label>
                            <UpperCaseField name="workOrderNumber" />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>P.O. No.:</label>
                            <UpperCaseField name="poNumber" />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>Due Date of Commencement:</label>
                            <Field type="date" name="dueDateOfCommencement" className="form-control" />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>J.W.O. No.:</label>
                            <UpperCaseField name="jwoNumber" />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>Sub-Division:</label>
                            <UpperCaseField name="subDivision" />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>Due Date of Completion of Work:</label>
                            <Field type="date" name="dueDateOfCompletionOfWork" className="form-control" />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>Date of Completion:</label>
                            <Field type="date" name="dateOfCompletion" className="form-control" />
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="form-group mb-3">
                            <label>Name of Contractor:</label>
                            <Field
                              type="text"
                              name="nameOfContractor"
                              readOnly
                              className="form-control-plaintext fw-bold"
                            />
                          </div>
                        </Col>
                      </Row>

                      <div className="form-group mb-3">
                        <label>Name of Work:</label>
                        <UpperCaseField name="nameOfWork" as="textarea" rows={3} />
                      </div>

                      <div className="form-group mb-3">
                        <label>Time Limit as per Sub Work Order:</label>
                        <Field name="timeLimitAsPerSubWorkOrder">
                          {({ field, form }) => (
                            <input
                              {...field}
                              type="text"
                              className="form-control"
                              onChange={(e) => {
                                form.setFieldValue(
                                  "timeLimitAsPerSubWorkOrder",
                                  e.target.value.toUpperCase()
                                );
                              }}
                              onBlur={(e) => {
                                field.onBlur(e);
                                const val = e.target.value.trim();
                                if (val && !val.endsWith(" DAYS")) {
                                  form.setFieldValue(
                                    "timeLimitAsPerSubWorkOrder",
                                    `${val} DAYS`
                                  );
                                }
                              }}
                            />
                          )}
                        </Field>
                      </div>

                      {/* PDF Format Selection */}
                      <div className="mb-3 p-3 border rounded bg-light">
                        <label className="form-label fw-bold mb-2">📄 PDF Format:</label>
                        <div className="d-flex gap-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="pdfFormat"
                              id="formatVertical"
                              value="vertical"
                              checked={pdfFormat === "vertical"}
                              onChange={(e) => setPdfFormat(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="formatVertical">
                              <strong>Vertical Table (Portrait)</strong>
                              <br />
                              <small className="text-muted">Traditional row-based layout</small>
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="pdfFormat"
                              id="formatHorizontal"
                              value="horizontal"
                              checked={pdfFormat === "horizontal"}
                              onChange={(e) => setPdfFormat(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="formatHorizontal">
                              <strong>Horizontal Table (Landscape)</strong>
                              <br />
                              <small className="text-muted">Excel-like column-based layout</small>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                        <Button
                          variant="outline-primary"
                          onClick={() => {
                            setTempName("");
                            setSelectedDescriptions([]);
                            setEditingIndex(null);
                            setProjectDetails((prev) => ({ ...prev }));
                            setShowModal(true);
                          }}
                        >
                          ➕ Add/Edit Entries
                        </Button>

                        <Button type="submit" variant="success" disabled={isSubmitting}>
                          {isSubmitting ? "Generating PDF..." : "Submit & Download PDF"}
                        </Button>
                      </div>
                    </Form>
                  </>
                )}
              </Formik>

              {/* ===== Current Project Entries Display ===== */}
              {/* This shows the entries for the project curently being edited/created */}
              <div className="mt-5">
                {projectDetails.entries.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="text-secondary fw-bold mb-0">📋 Entries for: {projectDetails.projectName || "New Project"}</h5>
                    <Button
                      variant="outline-primary"
                      onClick={() => setShowModal(true)}
                      className="shadow-sm"
                      title="Edit Project Details"
                    >
                      <Pencil size={18} />
                    </Button>
                  </div>
                )}

                {projectDetails.entries.length > 0 ? (
                  <div className="border rounded shadow-sm bg-white overflow-hidden">
                    {projectDetails.entries.map((entry, entryIndex) => {
                      // Totals calculation for this specific entry
                      const entryTotals = {};
                      const item4 = entry.descriptions.find(d => d.itemCode === "9925000007");
                      const item5 = entry.descriptions.find(d => d.itemCode === "9925000009");

                      if (item4 && item5) {
                        const unit = item4.unit || "Meter";
                        if (!entryTotals[unit]) entryTotals[unit] = { main: 0, spare: 0 };
                        entryTotals[unit].main += Math.max(parseQuantity(item4.mainCableQty), parseQuantity(item5.mainCableQty));
                        entryTotals[unit].spare += Math.max(parseQuantity(item4.spareCableQty), parseQuantity(item5.spareCableQty));
                      }

                      entry.descriptions.forEach((d) => {
                        if (item4 && item5 && (d.itemCode === "9925000007" || d.itemCode === "9925000009")) return;
                        const unit = d.unit || "Meter";
                        if (!entryTotals[unit]) entryTotals[unit] = { main: 0, spare: 0 };
                        entryTotals[unit].main += parseQuantity(d.mainCableQty);
                        entryTotals[unit].spare += parseQuantity(d.spareCableQty);
                      });

                      return (
                        <div key={entryIndex} className="mb-5 shadow-sm border p-3 rounded bg-white">
                          {/* Location Name Header */}
                          <div
                            className="d-flex justify-content-between align-items-center p-2 mb-2 rounded"
                            style={{ backgroundColor: "#495057", color: "white", border: "2px solid #333" }}
                          >
                            <h5 className="mb-0 fw-bold ps-2">{entry.name}</h5>
                            <div className="no-print">
                              <Button size="sm" variant="light" className="me-2" onClick={() => handleEditEntry(entryIndex)}>✎ Edit</Button>
                              <Button size="sm" variant="danger" onClick={() => handleRemoveName(entryIndex)}>✕ Remove</Button>
                            </div>
                          </div>

                          <Table bordered hover responsive className="align-middle mb-0">
                            <thead className="table-light text-center">
                              <tr>
                                <th style={{ width: "20%", border: "2px solid #333" }}>Item Code</th>
                                <th style={{ width: "40%", border: "2px solid #333" }}>Description</th>
                                <th style={{ width: "20%", border: "2px solid #333" }}>Main Cable</th>
                                <th style={{ width: "20%", border: "2px solid #333" }}>Spare Cable</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.descriptions.map((d, i) => (
                                <tr key={`${entryIndex}-${i}`}>
                                  <td style={{ border: "1px solid #333" }}>{d.itemCode === "9925000010" ? "" : (d.itemCode || "-")}</td>
                                  <td style={{ border: "1px solid #333" }}>{d.desc}</td>
                                  <td className="text-center" style={{ border: "1px solid #333" }}>
                                    {d.mainCableQty ? (d.unit ? `${d.mainCableQty} ${d.unit}` : d.mainCableQty) : "-"}
                                  </td>
                                  <td className="text-center" style={{ border: "1px solid #333" }}>
                                    {d.spareCableQty ? (d.unit ? `${d.spareCableQty} ${d.unit}` : d.spareCableQty) : "-"}
                                  </td>
                                </tr>
                              ))}
                              {/* Entry Total Row */}
                              <tr className="fw-bold" style={{ borderTop: "2px solid #333" }}>
                                <td colSpan="2" className="text-end align-middle" style={{ border: "2px solid #333" }}>Total:</td>
                                <td className="text-center align-middle" style={{ border: "2px solid #333" }}>
                                  <div className="d-flex flex-column gap-1 align-items-center justify-content-center">
                                    {Object.entries(entryTotals).map(([unit, counts], idx) => (
                                      counts.main > 0 && <div key={idx}>{counts.main} {unit}</div>
                                    ))}
                                  </div>
                                </td>
                                <td className="text-center align-middle" style={{ border: "2px solid #333" }}>
                                  <div className="d-flex flex-column gap-1 align-items-center justify-content-center">
                                    {Object.entries(entryTotals).map(([unit, counts], idx) => (
                                      counts.spare > 0 && <div key={idx}>{counts.spare} {unit}</div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </Table>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted fst-italic p-4 border rounded bg-white text-center">No entries added to this project yet.</p>
                )}

                {/* ===== Project Totals (Description-wise) ===== */}
                {projectDetails.entries.length > 0 && (
                  <div className="mt-4 border rounded shadow-sm bg-white overflow-hidden">
                    <div className="bg-light px-3 py-2 border-bottom">
                      <h6 className="fw-bold mb-0 text-primary">📊 Project Totals (Description-wise)</h6>
                    </div>
                    <Table bordered hover responsive className="align-middle mb-0">
                      <thead className="table-light text-center">
                        <tr>
                          <th style={{ width: "15%", border: "2px solid #333" }}>Item Code</th>
                          <th style={{ width: "45%", border: "2px solid #333" }}>Description</th>
                          <th style={{ width: "20%", border: "2px solid #333" }}>Total Main Cable</th>
                          <th style={{ width: "20%", border: "2px solid #333" }}>Total Spare Cable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Calculate totals
                          const totals = {};
                          // Order to maintain consistent display order based on itemCode/description
                          const order = [];

                          projectDetails.entries.forEach(entry => {
                            entry.descriptions.forEach(d => {
                              const key = `${d.itemCode}_${d.desc}`; // Use composite key
                              if (!totals[key]) {
                                totals[key] = {
                                  itemCode: d.itemCode,
                                  desc: d.desc,
                                  unit: d.unit,
                                  main: 0,
                                  spare: 0
                                };
                                order.push(key);
                              }
                              totals[key].main += parseQuantity(d.mainCableQty);
                              totals[key].spare += parseQuantity(d.spareCableQty);
                            });
                          });

                          if (order.length === 0) return <tr><td colSpan="4" className="text-center text-muted">No items to total.</td></tr>;



                          // Convert to array
                          const rows = order.sort().map(key => {
                            const item = totals[key];
                            return (
                              <tr key={key}>
                                <td style={{ border: "1px solid #333" }}>{item.itemCode === "9925000010" ? "" : (item.itemCode || "-")}</td>
                                <td style={{ border: "1px solid #333" }}>{item.desc}</td>
                                <td className="text-center fw-semibold" style={{ border: "1px solid #333" }}>
                                  {item.main > 0 ? `${item.main} ${item.unit ? item.unit : ""}` : "-"}
                                </td>
                                <td className="text-center fw-semibold" style={{ border: "1px solid #333" }}>
                                  {item.spare > 0 ? `${item.spare} ${item.unit ? item.unit : ""}` : "-"}
                                </td>
                              </tr>
                            );
                          });

                          // Calculate Total Utilized for specific items
                          let totalUtilized = 0;
                          projectDetails.entries.forEach(entry => {
                            entry.descriptions.forEach(d => {
                              let isMatch = false;
                              if (d.itemCode === "9925000007") isMatch = true;
                              if (d.itemCode === "9925000047" && d.desc.includes("11KV cable loop")) isMatch = true;
                              if (d.itemCode === "9925000010") isMatch = true;

                              if (isMatch) {
                                totalUtilized += parseQuantity(d.mainCableQty);
                                totalUtilized += parseQuantity(d.spareCableQty);
                              }
                            });
                          });

                          // Append Total Cable Utilized Row
                          rows.push(
                            <tr key="total-utilized" style={{ borderTop: "2px solid #333" }}>
                              <td style={{ border: "1px solid #333", backgroundColor: "#f9f9f9" }}></td>
                              <td className="text-end fw-bold" style={{ border: "1px solid #333", backgroundColor: "#f9f9f9", whiteSpace: "nowrap", fontSize: "12px" }}>
                                Total 11KV Cable Utilized (Start to End)
                              </td>
                              <td colSpan="2" className="text-center fw-bold" style={{ border: "1px solid #333", backgroundColor: "#f9f9f9" }}>
                                {totalUtilized} Meter
                              </td>
                            </tr>
                          );

                          return rows;
                        })()}
                      </tbody>
                    </Table>
                  </div>
                )}

                <div className="d-flex justify-content-end mt-3">
                  <Button
                    variant="dark"
                    onClick={handleProjectSave}
                    className="shadow px-4"
                  >
                    <Save size={18} className="me-2" /> {editingProjectId ? "Update Project" : "Save Project"}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* PDF Template */}
      {formValues && (
        <div
          ref={pdfRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0, // In view for html2canvas
            zIndex: -5, // Behind the white wrapper
            visibility: "visible",
            background: "white",
          }}
        >
          <PdfTemplate
            values={formValues}
            allProjects={formValues.allProjects || []}
            onReady={() => setIsPdfMounted(true)}
          />
        </div>
      )}

      {/* Project Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header className="bg-light d-flex justify-content-between align-items-center">
          <Modal.Title className="fw-bold text-primary">🛠️ Project Setup</Modal.Title>
          <Button variant="link" onClick={() => setShowModal(false)} className="text-secondary p-0 text-decoration-none">
            <X size={24} />
          </Button>
        </Modal.Header>
        <Modal.Body>
          <BootstrapForm>
            <Row className="mb-3">
              <Col md={6}>
                <BootstrapForm.Label>Project Name:</BootstrapForm.Label>
                <BootstrapForm.Control
                  value={modalProjectName}
                  onChange={(e) => setModalProjectName(e.target.value.toUpperCase())}
                  placeholder="Enter project name"
                />
              </Col>
              <Col md={6}>
                <BootstrapForm.Label>Project Number:</BootstrapForm.Label>
                <BootstrapForm.Control
                  value={modalProjectNumber}
                  onChange={(e) => setModalProjectNumber(e.target.value.toUpperCase())}
                  placeholder="Enter project number"
                />
              </Col>
            </Row>

            <hr />
            <h5 className="mb-3 text-secondary">Add Location Name & Description</h5>

            <BootstrapForm.Label>Location Name:</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              ref={nameInputRef} // Attach ref
              placeholder="Enter name"
              value={tempName}
              onChange={(e) => setTempName(e.target.value.toUpperCase())}
            />

            <BootstrapForm.Label className="mt-3">Description:</BootstrapForm.Label>
            <Dropdown autoClose="outside" className="w-100">
              <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start">
                {selectedDescriptions.length > 0
                  ? `${selectedDescriptions.length} selected`
                  : "Select Descriptions"}
              </Dropdown.Toggle>
              <Dropdown.Menu className="w-100 p-2">
                {descriptionOptions.map((item) => (
                  <Dropdown.Item
                    as="div"
                    key={item.id}
                    className="d-flex align-items-center gap-3 px-3 py-2 border-bottom"
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleDescription(item)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDescriptions.some((d) => d.id === item.id)}
                      readOnly
                      style={{ cursor: "pointer", width: "16px", height: "16px", marginRight: '10px' }}
                    />
                    <span className="flex-grow-1">{item.desc}</span>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            {selectedDescriptions.map((d, i) => (
              <div key={i} className="mt-3 p-3 border rounded bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{d.desc}</strong>
                    <br />
                    <small className="text-muted">Item Code: {d.itemCode}</small>
                  </div>

                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      setSelectedDescriptions((prev) =>
                        prev.filter((item) => item.id !== d.id)
                      );
                    }}
                  >
                    <X size={14} />
                  </Button>
                </div>

                <Row className="mt-3">
                  <Col md={12} className="mb-2">
                    <div className="p-3 bg-white rounded border shadow-sm">
                      <BootstrapForm.Label className="fw-bold text-muted small mb-2">UNIT TYPE : </BootstrapForm.Label>
                      <BootstrapForm.Select
                        value={d.unit || "Meter"}
                        onChange={(e) => handleCableChange(d.desc, "unit", e.target.value)}
                        className="shadow-sm border-secondary-subtle"
                        style={{ cursor: "pointer", fontSize: '1rem', marginLeft: '10px' }}
                      >
                        <option value="Meter">Meter</option>
                        <option value="Nos">Nos</option>
                        <option value="Set">Set</option>
                        <option value="Per Job">Per Job</option>
                      </BootstrapForm.Select>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <BootstrapForm.Label>Main :</BootstrapForm.Label>
                    <BootstrapForm.Control
                      type="text"
                      value={d.mainCableQty}
                      placeholder={`e.g. 20 ${d.unit ? d.unit : ""}`}
                      onChange={(e) =>
                        handleCableChange(d.desc, "mainCableQty", e.target.value)
                      }
                    />
                  </Col>
                  <Col md={6}>
                    <BootstrapForm.Label>Spare :</BootstrapForm.Label>
                    <BootstrapForm.Control
                      type="text"
                      value={d.spareCableQty}
                      placeholder={`e.g. 10 ${d.unit ? d.unit : ""}`}
                      onChange={(e) =>
                        handleCableChange(d.desc, "spareCableQty", e.target.value)
                      }
                    />
                  </Col>
                </Row>
              </div>
            ))}

            <div className="d-flex justify-content-end mt-3">
              <Button
                variant="primary"
                disabled={!tempName || selectedDescriptions.length === 0}
                onClick={handleAddOrUpdateEntry}
              >
                {editingIndex !== null ? (
                  <>
                    <Save size={16} className="me-2" /> Save Changes
                  </>
                ) : (
                  <>
                    <Plus size={16} className="me-2" /> Add Entry
                  </>
                )}
              </Button>
            </div>

            {projectDetails.entries.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-bold text-secondary">Live View:</h6>
                {projectDetails.entries.map((entry, index) => (
                  <div key={index} className="mb-3 border rounded p-3 shadow-sm">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-semibold text-dark mb-0">{entry.name}</h6>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          style={{ marginRight: '8px' }}
                          onClick={() => handleEditEntry(index)}
                        >
                          <Pencil size={14} className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveName(index)}
                        >
                          <Trash size={14} className="me-1" /> Remove
                        </Button>
                      </div>
                    </div>

                    {entry.descriptions.map((d, i) => (
                      <div
                        key={i}
                        className="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2 bg-light"
                      >
                        <div>
                          <div><strong>{d.desc}</strong> <span className="badge bg-secondary ms-2">{d.unit || "Meter"}</span></div>
                          {d.mainCableQty && (
                            <div>Main Cable: <span className="fw-semibold">{d.mainCableQty} {d.unit ? d.unit : ""}</span></div>
                          )}
                          {d.spareCableQty && (
                            <div>Spare Cable: <span className="fw-semibold">{d.spareCableQty} {d.unit ? d.unit : ""}</span></div>
                          )}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveDescription(entry.name, d.desc)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </BootstrapForm>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* === DELETE CONFIRMATION MODAL === */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this project? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteProject}>
            Delete Project
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default BillForm;
