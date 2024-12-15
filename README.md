# Revisium

![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)

**Status: Experimental and Not Production-Ready**

Revisium is a tool (UI/API) inspired by JSON (JSON Schema) and Git, designed to provide a flexible and low-level headless CMS solution. **This project originated from a closed-source repository** where it was developed over the course of a year and a half as a proof of concept. I am now making it open source to foster community involvement, transparency, and collaborative improvement.

## About

Revisium leverages the power of JSON schemas and the concepts of version control systems similar to Git to offer a robust framework for content management. Whether you're building a simple website or a complex application, Revisium can serve as the backbone for your content infrastructure, allowing for seamless integration and customization.

<img width="1505" alt="Revisium" src="https://github.com/user-attachments/assets/ef56cc5b-f891-4724-9cae-d6b7ff797dc6" />

## Getting Started

### Running Revisium with Docker

You can run **Revisium** using Docker by executing the following command.

```shell
docker run -d \
  --name revisium \
  --env DATABASE_URL="postgresql://<db_user>:<db_password>@host.docker.internal:5432/<database>" \
  -p 8080:8080 \
  revisium/revisium:master
```

### Running Revisium with Docker Compose

[docker-compose.yml](./docker-compose.yml)

### Accessing
Once the services are up and running, you can access the Revisium application using the following default credentials:

- URL: http://localhost:8080
- Username: admin
- Password: admin

## Key Features

- **SaaS or Self-Hosted**: Flexible deployment options to suit your infrastructure needs.
- **Declarative Schema Creation and Editing**: Easily define and modify data schemas in a declarative manner.
- **Versioning and State Management**: Manage schema and data versions with Git-like revision control, branching, and forking.
- **Automatic API Generation**: Generate REST and GraphQL APIs automatically based on your schemas.
- **Support for Primitives, Arrays, Objects, and Hierarchies**: Handle a wide range of data types, including root-level values and nested structures.
- **Schema Relationships**: Establish connections between schemas, allowing JSON fields to be assigned as keys with referential integrity support.
- **Data Migrations**: Handle schema changes with data migrations, including renaming, creating, deleting fields, type transformations, and moving fields between nodes.
- **UI and API Access**: Interact with Revisium through both a user-friendly interface and a powerful API.

## Usage Examples

- **Low-Level Headless CMS**: Utilize Revisium as the foundation for your content management needs without being tied to a specific front-end.
- **Source of Truth for Configurations and Reference Tables**: Manage configurations and reference data within your databases, including initial database seeding.
- **Remote Configuration Management**: Control and update remote configurations seamlessly.
- **Immutable or Draft Data States**: Ensure data immutability or manage draft states for atomic data updates.
- **Data Branching for Different Environments**: Create data branches for environments like "develop," "staging," and "production."
- **Importing Schemas from Version Control Systems**: Import configuration and reference information from repositories for enhanced service management.
- **Versioned Backups with Fast Access**: Maintain versioned backups that can be quickly accessed via API or UI.
- **Quick Forking of Templates**: Clone templates with predefined schemas and data to create tailored instances for specific entities or projects. Each user project or entity can start with a standard set of schemas and data while maintaining independent API and versioning.

## Disclaimer

Please note that this codebase is still in an early, experimental stage. It may contain incomplete features, limited documentation, and potential stability issues. **It is not recommended for production use at this time.**

## License

This project is licensed under the [Apache License 2.0](./LICENSE).
