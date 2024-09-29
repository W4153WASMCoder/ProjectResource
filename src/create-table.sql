drop schema if exists db_project_resource;

create schema db_project_resource;

use db_project_resource;

create table projects(
    project_id       int NOT NULL,
    owner_user_id    int,
    project_name     nvarchar(100),
    language_name    nvarchar(100),
    create_date      DATETIME DEFAULT NOW(),
    primary key (project_id),
    foreign key (language_name) references languages (language_name)
);

create table languages(
    language_id             int NOT NULL,
    language_name           nvarchar(100) NOT NULL,
    compiler_invocation     nvarchar(500),
    create_date      DATETIME DEFAULT NOW(),
    primary key (language_id)
);

create table project_files(
    file_id         int NOT NULL,
    project_id      int,
    parent_dir      int DEFAULT NULL,
    file_name       nvarchar(100),
    is_dir          bool DEFAULT FALSE,
    create_date      DATETIME DEFAULT NOW(),
    primary key (file_id),
    foreign key (project_id) references projects (project_id),
    foreign key (parent_dir) references project_files (file_id)
);

