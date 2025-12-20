import React, { useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
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

  // Modal State for Project Name/Number
  const [modalProjectName, setModalProjectName] = useState("");
  const [modalProjectNumber, setModalProjectNumber] = useState("");

  const [projectDetails, setProjectDetails] = useState({
    projectName: "",
    projectNumber: "",
    entries: [],
  });

  const [tempName, setTempName] = useState("");
  const [selectedDescriptions, setSelectedDescriptions] = useState([]);

  const descriptionOptions = [
    { id: 1, itemCode: "9925000001", desc: "Excavation of cable trench 400mm width x 1200mm depth" },
    { id: 2, itemCode: "9925000002", desc: "Excavation of cable trench 600mm width x 1200mm depth" },
    { id: 3, itemCode: "9925000004", desc: "Length of cable in trench complete" },
    { id: 4, itemCode: "9925000007", desc: "Horizontal drilling using Auger machine & putting of HDPE pipe & laying of cable" },
    { id: 5, itemCode: "9925000009", desc: "Green color 110mm HDPE pipe" },
    { id: 6, itemCode: "9925000011", desc: "Concrete stone route marker" },
    { id: 7, itemCode: "9925000014", desc: "Cable rising on DP structure" },
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
    { id: 18, itemCode: "9925000047", desc: "Cable rising at DP structure" }
  ];




  const initialValues = {
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

  // const validationSchema = Yup.object({
  //   name: Yup.string().required("Required"),
  //   dateOfCommunication: Yup.date().required("Required"),
  //   workOrderNumber: Yup.string().required("Required"),
  //   poNumber: Yup.string().required("Required"),
  //   dueDateOfCommencement: Yup.date().required("Required"),
  //   jwoNumber: Yup.string().required("Required"),
  //   subDivision: Yup.string().required("Required"),
  //   dueDateOfCompletionOfWork: Yup.date().required("Required"),
  //   dateOfCompletion: Yup.date().nullable(),
  //   nameOfWork: Yup.string().required("Required"),
  //   timeLimitAsPerSubWorkOrder: Yup.string().required("Required"),
  // });

  // === PDF GENERATE ===
  // === PDF GENERATE ===
  const generatePDF = async (values) => {
    return new Promise((resolve) => {
      const fullValues = { ...values, allProjects };
      setFormValues(fullValues);

      // Make PdfTemplate render
      setIsPdfReady(true);

      // Give React a moment to render the view
      setTimeout(() => {
        const input = pdfRef.current;
        if (!input) {
          alert("PDF content not ready!");
          setIsPdfReady(false);
          resolve();
          return;
        }

        const doc = new jsPDF({
          orientation: "p",
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
          width: 540, // A4 width (595.28) - margins -> Target ~555pt. Using 540 to be safe.
          windowWidth: 750, // Corresponds to CSS width + padding
          margin: [20, 20, 20, 20],
          autoPaging: 'text',
          html2canvas: {
            scale: 0.74, // 555pt / 750px ~= 0.74
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

    if (!name) return alert("Please enter a name");
    if (selectedDescriptions.length === 0)
      return alert("Please select at least one description");

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

    // Scroll to the input field
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        nameInputRef.current.focus();
      }
    }, 100);
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

  const handleProjectSave = () => {
    const pName = modalProjectName.trim();
    const pNumber = modalProjectNumber.trim();

    if (!pName || !pNumber) {
      alert("Please fill both Project Name and Project Number");
      return;
    }

    if (projectDetails.entries.length === 0) {
      alert("Please add at least one entry before saving.");
      return;
    }

    const newProject = {
      ...projectDetails,
      projectName: pName,
      projectNumber: pNumber,
    };

    setAllProjects((prev) => [...prev, newProject]); // ✅ Add to all projects
    // Reset
    setProjectDetails({ projectName: "", projectNumber: "", entries: [] });
    setModalProjectName("");
    setModalProjectNumber("");
    setShowModal(false);
  };


  const handleDeleteProject = (index) => {
    setAllProjects((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Main Content Wrapper - Occludes the hidden PDF */}
      <div style={{ position: "relative", zIndex: 5, backgroundColor: "#ffffff", minHeight: "100vh", padding: "1px 0" }}>
        <div className="container my-4">
          <h2 className="text-center mb-4">Inventory Bill Form</h2>

          {/* ===== Main Form ===== */}
          <Formik
            initialValues={initialValues}
            // validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <>
                {isSubmitting && (
                  <div className="loader-overlay">
                    <Spinner animation="border" variant="light" style={{ width: "3rem", height: "3rem" }} />
                    <h4>Generating PDF...</h4>
                  </div>
                )}
                <Form className="p-3 border rounded bg-light shadow-sm">
                  <div className="form-group mb-3">
                    <label>Name:</label>
                    <UpperCaseField name="name" />
                    <ErrorMessage name="name" component="div" className="text-danger" />
                  </div>

                  <div className="form-group">
                    <label>Date of Communication:</label>
                    <Field type="date" name="dateOfCommunication" className="form-control" />
                    <ErrorMessage
                      name="dateOfCommunication"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label>Work Order Number:</label>
                    <UpperCaseField name="workOrderNumber" />
                    <ErrorMessage
                      name="workOrderNumber"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label>P.O. No.:</label>
                    <UpperCaseField name="poNumber" />
                    <ErrorMessage
                      name="poNumber"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label>Due Date of Commencement:</label>
                    <Field type="date" name="dueDateOfCommencement" className="form-control" />
                    <ErrorMessage
                      name="dueDateOfCommencement"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label>J.W.O. No.:</label>
                    <UpperCaseField name="jwoNumber" />
                    <ErrorMessage
                      name="jwoNumber"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label>Sub-Division:</label>
                    <UpperCaseField name="subDivision" />
                    <ErrorMessage
                      name="subDivision"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label>Due Date of Completion of Work:</label>
                    <Field type="date" name="dueDateOfCompletionOfWork" className="form-control" />
                    <ErrorMessage
                      name="dueDateOfCompletionOfWork"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of Completion:</label>
                    <Field type="date" name="dateOfCompletion" className="form-control" />
                  </div>

                  <div className="form-group">
                    <label>Name of Work:</label>
                    <UpperCaseField name="nameOfWork" as="textarea" rows={3} />
                    <ErrorMessage
                      name="nameOfWork"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="form-group">
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
                            field.onBlur(e); // Handle standard Formik blur (touched state)
                            const val = e.target.value.trim();
                            // If there is a value and it doesn't already end with " DAYS", append it
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
                    <ErrorMessage
                      name="timeLimitAsPerSubWorkOrder"
                      component="div"
                      className="text-danger"
                    />
                  </div>

                  <div className="form-group">
                    <label>Name of Contractor:</label>
                    <Field
                      type="text"
                      name="nameOfContractor"
                      readOnly
                      className="form-control-plaintext"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="d-flex justify-content-between mt-4">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setTempName("");
                        setSelectedDescriptions([]);
                        setEditingIndex(null);
                        setProjectDetails((prev) => ({ ...prev }));
                        // Clear modal state inputs on open
                        setModalProjectName("");
                        setModalProjectNumber("");
                        setShowModal(true);
                      }}
                    >
                      ➕ Add Project
                    </Button>
                    <Button type="submit" variant="success" disabled={isSubmitting}>
                      {isSubmitting ? "Generating PDF..." : "Submit & Download PDF"}
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </Formik>

          {/* ===== Project Table Display (Header + Table) ===== */}
          {allProjects.length > 0 && (
            <div className="mt-5">
              <h5 className="text-secondary fw-bold mb-3">📋 Added Projects</h5>

              {allProjects.map((project, projectIndex) => (
                <div
                  key={projectIndex}
                  className="border rounded mb-4 shadow-sm bg-white overflow-hidden"
                >
                  {/* Project Header */}
                  <div className="bg-primary text-white p-3">
                    <h5 className="mb-0">
                      <strong>{project.projectName}</strong>{" "}
                      <span className="fw-light">({project.projectNumber})</span>
                    </h5>
                  </div>

                  {/* Project Data Table */}
                  <div className="p-3">
                    {project.entries.length > 0 ? (
                      <Table bordered hover responsive className="align-middle">
                        <thead className="table-light text-center">
                          <tr>
                            <th style={{ width: "5%" }}>Name</th>
                            <th style={{ width: "15%" }}>Item Code</th>
                            <th style={{ width: "40%" }}>Description</th>
                            <th style={{ width: "20%" }}>Main Cable</th>
                            <th style={{ width: "20%" }}>Spare Cable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.entries.map((entry, entryIndex) => {
                            // Calculate totals for this entry
                            const entryTotals = {};
                            entry.descriptions.forEach((d) => {
                              const unit = d.unit || "Meter";
                              if (!entryTotals[unit]) entryTotals[unit] = { main: 0, spare: 0 };
                              entryTotals[unit].main += parseQuantity(d.mainCableQty);
                              entryTotals[unit].spare += parseQuantity(d.spareCableQty);
                            });

                            return (
                              <React.Fragment key={entryIndex}>
                                {entry.descriptions.map((d, i) => (
                                  <tr key={`${entryIndex}-${i}`}>
                                    {/* Only show name for first description */}
                                    {i === 0 ? (
                                      <td
                                        rowSpan={entry.descriptions.length + 1}
                                        className="fw-semibold align-middle bg-light vertical-name-cell"
                                      >
                                        {entry.name}
                                      </td>
                                    ) : null}

                                    <td>{d.itemCode || "-"}</td>
                                    <td>{d.desc}</td>
                                    <td className="text-center">
                                      {d.mainCableQty ? (d.unit && d.unit !== "Meter" ? `${d.mainCableQty} ${d.unit}` : d.mainCableQty) : "-"}
                                    </td>
                                    <td className="text-center">
                                      {d.spareCableQty ? (d.unit && d.unit !== "Meter" ? `${d.spareCableQty} ${d.unit}` : d.spareCableQty) : "-"}
                                    </td>
                                  </tr>
                                ))}
                                {/* Entry Total Row */}
                                <tr className="fw-bold">
                                  <td colSpan="2" className="text-end align-middle">Total:</td>
                                  <td className="text-center align-middle">
                                    <div className="d-flex flex-column gap-1 align-items-center justify-content-center">
                                      {Object.entries(entryTotals).map(([unit, counts], idx) => (
                                        counts.main > 0 && (
                                          <div key={idx}>
                                            {counts.main} {unit}
                                          </div>
                                        )
                                      ))}
                                      {Object.values(entryTotals).every(c => c.main === 0) && "-"}
                                    </div>
                                  </td>
                                  <td className="text-center align-middle">
                                    <div className="d-flex flex-column gap-1 align-items-center justify-content-center">
                                      {Object.entries(entryTotals).map(([unit, counts], idx) => (
                                        counts.spare > 0 && (
                                          <div key={idx}>
                                            {counts.spare} {unit}
                                          </div>
                                        )
                                      ))}
                                      {Object.values(entryTotals).every(c => c.spare === 0) && "-"}
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-muted fst-italic">No entries added.</p>
                    )}


                    <div className="mt-4 p-3 rounded border bg-white shadow-sm w-100">

                      <h5 className="fw-bold text-primary mb-3">
                        📌 Project Total for:
                        <span className="text-dark ms-5">{project.projectName}</span>
                        <span className="text-muted ms-2">({project.projectNumber})</span>
                      </h5>

                      <Table bordered responsive className="text-center w-100 mb-0">
                        <thead className="bg-secondary text-white me-2">
                          <tr>
                            <th>Unit Type</th>
                            <th>Total Main Cable</th>
                            <th>Total Spare Cable</th>
                          </tr>
                        </thead>

                        <tbody>
                          {(() => {
                            const totals = {};

                            project.entries.forEach(entry => {
                              entry.descriptions.forEach(d => {
                                const unit = d.unit || "Meter";
                                if (!totals[unit]) totals[unit] = { main: 0, spare: 0 };
                                totals[unit].main += parseQuantity(d.mainCableQty);
                                totals[unit].spare += parseQuantity(d.spareCableQty);
                              });
                            });

                            if (Object.values(totals).every(t => t.main === 0 && t.spare === 0)) {
                              return (
                                <tr>
                                  <td colSpan="3" className="text-muted py-3">
                                    No cable quantities added
                                  </td>
                                </tr>
                              );
                            }

                            return Object.entries(totals).map(([unit, t], idx) => (
                              <tr key={idx}>
                                <td className="fw-semibold">{unit}</td>
                                <td>{t.main > 0 ? `${t.main} ${unit}` : "-"}</td>
                                <td>{t.spare > 0 ? `${t.spare} ${unit}` : "-"}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </Table>
                    </div>










                    {/* Delete Project Button */}
                    <div className="text-end mt-3">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteProject(projectIndex)}
                      >
                        <Trash size={14} className="me-1" /> Delete Project
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
            <h5 className="mb-3 text-secondary">Add Name & Description</h5>

            <BootstrapForm.Label>Name:</BootstrapForm.Label>
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
                      placeholder={`e.g. 20 ${d.unit && d.unit !== "Meter" ? d.unit : ""}`}
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
                      placeholder={`e.g. 10 ${d.unit && d.unit !== "Meter" ? d.unit : ""}`}
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
                          disabled={false} // Explicitly enabled
                        >
                          <Pencil size={14} className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveName(index)}
                          disabled={false} // Explicitly enabled
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
                            <div>Main Cable: <span className="fw-semibold">{d.mainCableQty} {d.unit && d.unit !== "Meter" ? d.unit : ""}</span></div>
                          )}
                          {d.spareCableQty && (
                            <div>Spare Cable: <span className="fw-semibold">{d.spareCableQty} {d.unit && d.unit !== "Meter" ? d.unit : ""}</span></div>
                          )}
                        </div>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveDescription(entry.name, d.desc)}
                          disabled={false} // Explicitly enabled
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
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="success" onClick={handleProjectSave}>
            <Save size={16} className="me-2" /> Save Project
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
};

export default BillForm;
