// src/components/NavBar.js
import React from "react";
import { Navbar, Container, Nav } from "react-bootstrap";

export default function NavBar({ activeTab, onTabChange }) {
  return (
    <Navbar bg="primary" variant="dark" expand="md" className="mb-3">
      <Container fluid>
        <Navbar.Brand href="#" onClick={() => onTabChange("dashboard")}>
          Static Analysis Framework <span className="badge bg-warning ms-1">v2.0</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link
              active={activeTab === "dashboard"}
              onClick={() => onTabChange("dashboard")}
            >
              Dashboard
            </Nav.Link>
            <Nav.Link
              active={activeTab === "reports"}
              onClick={() => onTabChange("reports")}
            >
              Reports
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link
              href="http://localhost:8000"
              target="_blank"
              rel="noreferrer"
            >
              MobSF
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
