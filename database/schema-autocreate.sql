-- Cria tabelas apenas se não existirem (não apaga dados na subida do servidor)
SET NAMES utf8mb4;
SET foreign_key_checks = 0;

CREATE TABLE IF NOT EXISTS users (
  id int unsigned NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  role enum('client','freelancer','both') NOT NULL DEFAULT 'both',
  bio text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id int unsigned NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  description text NOT NULL,
  category varchar(255) NOT NULL,
  skills varchar(500) DEFAULT NULL,
  level enum('beginner','intermediate','expert') NOT NULL DEFAULT 'intermediate',
  budget decimal(10,2) NOT NULL,
  deadline date DEFAULT NULL,
  status enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
  client_id int unsigned NOT NULL,
  freelancer_id int unsigned DEFAULT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY client_id (client_id),
  KEY freelancer_id (freelancer_id),
  KEY status (status),
  CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_projects_freelancer FOREIGN KEY (freelancer_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proposals (
  id int unsigned NOT NULL AUTO_INCREMENT,
  cover_letter text NOT NULL,
  amount decimal(10,2) NOT NULL,
  delivery_time int NOT NULL,
  status enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  project_id int unsigned NOT NULL,
  freelancer_id int unsigned NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY one_proposal_per_freelancer (project_id, freelancer_id),
  KEY project_id (project_id),
  KEY freelancer_id (freelancer_id),
  CONSTRAINT fk_proposals_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_proposals_freelancer FOREIGN KEY (freelancer_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id int unsigned NOT NULL AUTO_INCREMENT,
  user_id int unsigned NOT NULL,
  type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  body text,
  link varchar(500) DEFAULT NULL,
  read_at datetime DEFAULT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  KEY read_at (read_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id int unsigned NOT NULL AUTO_INCREMENT,
  project_id int unsigned NOT NULL,
  sender_id int unsigned NOT NULL,
  body text NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY project_id (project_id),
  KEY sender_id (sender_id),
  CONSTRAINT fk_messages_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id int unsigned NOT NULL AUTO_INCREMENT,
  project_id int unsigned NOT NULL,
  reviewer_id int unsigned NOT NULL,
  reviewee_id int unsigned NOT NULL,
  rating tinyint unsigned NOT NULL,
  comment text,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY one_review_per_project_reviewer (project_id, reviewer_id),
  KEY reviewee_id (reviewee_id),
  CONSTRAINT fk_reviews_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
