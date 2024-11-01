import pool from "../db.js";
import type { RowDataPacket } from "mysql2";

export class Project {
    private _isDirty: boolean = false; // Track if the record needs saving

    ProjectID: number | null;
    private _owningUserID: number;
    private _projectName: string;
    private _creationDate: Date;

    constructor(
        ProjectID: number | null,
        OwningUserID: number,
        ProjectName: string,
        CreationDate: Date,
    ) {
        this.ProjectID = ProjectID;
        this._owningUserID = OwningUserID;
        this._projectName = ProjectName;
        this._creationDate = CreationDate;
        this._isDirty = ProjectID === null;
    }
    toJSON(): string {
        return JSON.stringify({
            ProjectID: this.ProjectID,
            OwningUserID: this.OwningUserID,
            ProjectName: this._projectName,
            CreationDate: this._creationDate,
        });
    }

    static async find(ProjectID: number): Promise<Project | null> {
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM projects WHERE project_id = ?",
                [ProjectID],
            );

            if (rows.length === 0) return null;

            const { owning_user_id, project_name, creation_date } = rows[0];
            return new Project(
                ProjectID,
                owning_user_id,
                project_name,
                new Date(creation_date),
            );
        } catch (error) {
            console.error(
                `Error fetching Project with ID ${ProjectID}:`,
                error,
            );
            return null;
        }
    }

    // Find all projects with pagination
    static async findAll(options: {
        limit: number;
        offset: number;
        filters?: { ProjectName?: string; OwningUserID?: number };
        sort?: string;
        order?: "asc" | "desc";
    }): Promise<{ projects: Project[]; total: number }> {
        const {
            limit,
            offset,
            filters = {},
            sort = "project_id",
            order = "asc",
        } = options;

        let filterClauses = "";
        const filterValues: any[] = [];

        if (filters.ProjectName) {
            filterClauses += " AND project_name LIKE ?";
            filterValues.push(`%${filters.ProjectName}%`);
        }

        if (filters.OwningUserID !== undefined) {
            filterClauses += " AND owning_user_id = ?";
            filterValues.push(filters.OwningUserID);
        }

        const totalQuery = `SELECT COUNT(*) as total FROM projects WHERE 1=1${filterClauses}`;
        const dataQuery = `SELECT * FROM projects WHERE 1=1${filterClauses} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;

        try {
            // Get total count
            const [countRows] = await pool.query<RowDataPacket[]>(
                totalQuery,
                filterValues,
            );
            const total = countRows[0].total;

            // Get projects with limit and offset
            const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [
                ...filterValues,
                limit,
                offset,
            ]);

            const projects = rows.map((row) => {
                const { project_id, owning_user_id, project_name, creation_date } =
                    row;
                return new Project(
                    project_id,
                    owning_user_id,
                    project_name,
                    new Date(creation_date),
                );
            });

            return { projects, total };
        } catch (error) {
            console.error("Error fetching projects:", error);
            throw error;
        }
    }
    // Save method to insert or update a project if it's dirty
    async save(): Promise<Project> {
        if (!this._isDirty) return this;

        if (this.ProjectID) {
            // Update existing project
            await pool.query(
                "UPDATE projects SET owning_user_id = ?, project_name = ?, creation_date = ? WHERE project_id = ?",
                [
                    this._owningUserID,
                    this._projectName,
                    this._creationDate,
                    this.ProjectID,
                ],
            );
        } else {
            // Insert new project and get the ID
            const [result]: any = await pool.query(
                "INSERT INTO projects (owning_user_id, project_name, creation_date) VALUES (?, ?, ?)",
                [this._owningUserID, this._projectName, this._creationDate],
            );
            this.ProjectID = result.insertId;
        }

        this._isDirty = false;
        return this;
    }
    static async deleteById(id: number): Promise<boolean> {
        try {
            // Check if file exists
            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM projects WHERE project_id = ?",
                [id],
            );

            if (rows.length === 0) {
                // Return false if the user does not exist
                return false;
            }

            // Proceed to delete the user
            await pool.query("DELETE FROM projects WHERE project_id = ?", [id]);
            return true;
        } catch (error) {
            // Log the error for debugging
            console.error("Error deleting file by ID:", error);

            // Return false in case of an error
            return false;
        }
    }
    get OwningUserID() {
        return this._owningUserID;
    }
    set OwningUserID(value: number) {
        if (value === this._owningUserID) return;

        this._owningUserID = value;
        this._isDirty = true;
    }

    get ProjectName() {
        return this._projectName;
    }
    set ProjectName(value: string) {
        if (value === this._projectName) return;

        this._projectName = value;
        this._isDirty = true;
    }

    get CreationDate() {
        return this._creationDate;
    }
    set CreationDate(value: Date) {
        if (value === this._creationDate) return;

        this._creationDate = value;
        this._isDirty = true;
    }
}
export class ProjectFile {
    private _isDirty: boolean = false;

    FileID: number | null;
    private _projectID: number;
    private _parentDirectory: number | null;
    private _fileName: string;
    private _isDirectory: boolean;
    private _creationDate: Date;

    constructor(
        FileID: number | null,
        ProjectID: number,
        ParentDirectory: number | null,
        FileName: string,
        IsDirectory: boolean,
        CreationDate: Date,
    ) {
        this.FileID = FileID;
        this._projectID = ProjectID;
        this._parentDirectory = ParentDirectory;
        this._fileName = FileName;
        this._isDirectory = IsDirectory;
        this._creationDate = CreationDate;
    }
    toJSON(): string {
        return JSON.stringify({
            FileID: this.FileID,
            ProjectID: this._projectID,
            ParentDirectory: this._parentDirectory,
            FileName: this._fileName,
            IsDirectory: this._isDirectory,
            CreationDate: this._creationDate,
        });
    }

    static async find(FileID: number): Promise<ProjectFile | null> {
        try {
            console.log("sql query: SELECT * FROM project_files WHERE file_id = %s", FileID);

            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM project_files WHERE file_id = ?",
                [FileID],
            );

            if (rows.length === 0) return null;

            console.log(rows);

            const {
                project_id,
                parent_directory,
                file_name,
                is_directory,
                creation_date,
            } = rows[0] as {
                project_id: number;
                parent_directory: number | null;
                file_name: string;
                is_directory: boolean;
                creation_date: string;
            };

            console.log(rows[0]);

            console.log("CreationDate: %s", creation_date);

            return new ProjectFile(
                FileID,
                project_id,
                parent_directory,
                file_name,
                !!is_directory,
                new Date(creation_date),
            );
        } catch (error) {
            console.error(
                `Error fetching ProjectFile with ID ${FileID}:`,
                error,
            );
            return null;
        }
    }
    // Find all project files with pagination
    static async findAll(options: {
        limit: number;
        offset: number;
        filters?: {
            ProjectID?: number;
            FileName?: string;
            IsDirectory?: boolean;
        };
        sort?: string;
        order?: "asc" | "desc";
    }): Promise<{ files: ProjectFile[]; total: number }> {
        const {
            limit,
            offset,
            filters = {},
            sort = "file_id",
            order = "asc",
        } = options;

        let filterClauses = "";
        const filterValues: any[] = [];

        // Build filter clauses
        if (filters.ProjectID !== undefined) {
            filterClauses += " AND project_id = ?";
            filterValues.push(filters.ProjectID);
        }

        if (filters.FileName) {
            filterClauses += " AND file_name LIKE ?";
            filterValues.push(`%${filters.FileName}%`);
        }

        if (filters.IsDirectory !== undefined) {
            filterClauses += " AND is_directory = ?";
            filterValues.push(filters.IsDirectory ? 1 : 0);
        }

        // Validate 'sort' and 'order' parameters to prevent SQL injection
        const validSortFields = [
            "file_id",
            "file_name",
            "create_date",
            "is_directory",
        ];
        if (!validSortFields.includes(sort)) {
            throw new Error(`Invalid sort field: ${sort}`);
        }

        const validOrderValues = ["asc", "desc"];
        if (!validOrderValues.includes(order)) {
            throw new Error(`Invalid order value: ${order}`);
        }

        const totalQuery = `SELECT COUNT(*) as total FROM project_files WHERE 1=1${filterClauses}`;
        const dataQuery = `SELECT * FROM project_files WHERE 1=1${filterClauses} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;

        try {
            // Get total count
            const [countRows] = await pool.query<RowDataPacket[]>(
                totalQuery,
                filterValues,
            );
            const total = countRows[0].total;

            // Get files with limit, offset, filters, and sorting
            const [rows] = await pool.query<RowDataPacket[]>(dataQuery, [
                ...filterValues,
                limit,
                offset,
            ]);

            const files = rows.map((row) => {
                const {
                    file_id,
                    project_id,
                    parent_directory,
                    file_name,
                    is_directory,
                    creation_date,
                } = row;
                return new ProjectFile(
                    file_id,
                    project_id,
                    parent_directory,
                    file_name,
                    !!is_directory,
                    new Date(creation_date),
                );
            });

            return { files, total };
        } catch (error) {
            console.error("Error fetching project files:", error);
            throw error;
        }
    }
    async save(): Promise<ProjectFile> {
        if (!this._isDirty) return this;

        if (this.FileID) {
            // Update existing file
            await pool.query(
                "UPDATE project_files SET project_id = ?, parent_directory = ?, file_name = ?, is_directory = ?, creation_date = ? WHERE file_id = ?",
                [
                    this._projectID,
                    this._parentDirectory,
                    this._fileName,
                    this._isDirectory,
                    this._creationDate,
                    this.FileID,
                ],
            );
        } else {
            // Insert new file and get the ID
            const [result]: any = await pool.query(
                "INSERT INTO project_files (project_id, parent_directory, file_name, is_directory, creation_date) VALUES (?, ?, ?, ?, ?)",
                [
                    this._projectID,
                    this._parentDirectory,
                    this._fileName,
                    this._isDirectory,
                    this._creationDate,
                ],
            );
            this.FileID = result.insertId;
        }

        this._isDirty = false;
        return this;
    }
    static async deleteById(id: number): Promise<boolean> {
        try {
            // Check if file exists
            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM project_files WHERE file_id = ?",
                [id],
            );

            if (rows.length === 0) {
                // Return false if the user does not exist
                return false;
            }

            // Proceed to delete the user
            await pool.query("DELETE FROM project_files WHERE file_id = ?", [
                id,
            ]);
            return true;
        } catch (error) {
            // Log the error for debugging
            console.error("Error deleting file by ID:", error);

            // Return false in case of an error
            return false;
        }
    }

    static async findByObject(obj: object): Promise<ProjectFile | null> {
        const {
            TargetProjectID,
            OwnerUserID,
            TargetFileID
        } = obj as {
            TargetProjectID: number,
            OwnerUserID: number,
            TargetFileID: string,
        };
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                "SELECT * FROM project_files JOIN projects using (project_id) WHERE project_files.project_id=? AND owning_user_id=? AND file_id=?",
                [TargetProjectID, OwnerUserID, TargetFileID],
            );

            if (rows.length === 0) return null;

            const {
                file_id,
                project_id,
                parent_directory,
                file_name,
                is_directory,
                creation_date,
            } = rows[0] as {
                file_id: number,
                project_id: number;
                parent_directory: number | null;
                file_name: string;
                is_directory: boolean;
                creation_date: Date;
            };

            console.log(rows);

            return new ProjectFile(
                file_id,
                project_id,
                parent_directory,
                file_name,
                !!is_directory,
                new Date(creation_date),
            );

        } catch (error) {
            console.error(
                `Error fetching ProjectFile with FileID ${TargetProjectID}, UserID ${OwnerUserID}, ProjectID ${TargetFileID}:`,
                error,
            );
            return null;
        }

    }

    get ProjectID() {
        return this._projectID;
    }
    set ProjectID(value: number) {
        if (value === this._projectID) return;

        this._projectID = value;
        this._isDirty = true;
    }

    get ParentDirectory() {
        return this._parentDirectory;
    }
    set ParentDirectory(value: number | null) {
        if (value === this._parentDirectory) return;

        this._parentDirectory = value;
        this._isDirty = true;
    }

    get FileName() {
        return this._fileName;
    }
    set FileName(value: string) {
        if (value === this._fileName) return;

        this._fileName = value;
        this._isDirty = true;
    }

    get IsDirectory() {
        return this._isDirectory;
    }
    set IsDirectory(value: boolean) {
        if (value === this._isDirectory) return;

        this._isDirectory = value;
        this._isDirty = true;
    }

    get CreationDate() {
        return this._creationDate;
    }
    set CreationDate(value: Date) {
        if (value === this._creationDate) return;

        this._creationDate = value;
        this._isDirty = true;
    }
}
