package edu.ucsb.cs156.frontiers.startup;

import edu.ucsb.cs156.frontiers.entities.Admin;
import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.entities.User;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.repositories.AdminRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.repositories.UserRepository;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** This class contains a `run` method that is called once at application startup time. */
@Slf4j
@Component
public class FrontiersStartup {

  @Value("#{'${app.admin.emails}'.split(',')}")
  List<String> adminEmails;

  @Value("${app.webhook.secret}")
  String webhookSecret;

  @Autowired AdminRepository adminRepository;

  @Autowired CourseRepository courseRepository;

  @Autowired CourseStaffRepository courseStaffRepository;

  @Autowired UserRepository userRepository;

  /**
   * Called once at application startup time . Put code here if you want it to run once each time
   * the Spring Boot application starts up in all environments.
   */
  public void alwaysRunOnStartup() {
    log.info("alwaysRunOnStartup called");

    validateWebhookSecret();

    try {
      adminEmails.forEach(
          (email) -> {
            Admin admin = new Admin(email);
            adminRepository.save(admin);
          });
    } catch (Exception e) {
      log.error("Error in loading all ADMIN_EMAILS:", e);
    }

    addMissingInstructorsAsStaff();
  }

  void addMissingInstructorsAsStaff() {
    try {
      for (Course course : courseRepository.findAll()) {
        String instructorEmail = course.getInstructorEmail();
        if (instructorEmail == null || instructorEmail.isBlank()) {
          continue;
        }
        if (courseStaffRepository.findByEmailAndCourse(instructorEmail, course).isPresent()) {
          continue;
        }

        CourseStaff courseStaff =
            CourseStaff.builder()
                .firstName("")
                .lastName("")
                .email(instructorEmail)
                .course(course)
                .orgStatus(
                    course.getInstallationId() != null ? OrgStatus.JOINCOURSE : OrgStatus.PENDING)
                .build();

        Optional<User> optionalUser = userRepository.findByEmail(instructorEmail);
        if (optionalUser.isPresent()) {
          User user = optionalUser.get();
          courseStaff.setUser(user);
          courseStaff.setFirstName(user.getGivenName());
          courseStaff.setLastName(user.getFamilyName());
        }

        courseStaffRepository.save(courseStaff);
        log.info(
            "Added instructor {} as staff member of course {}", instructorEmail, course.getId());
      }
    } catch (Exception e) {
      log.error("Error in adding missing instructors as course staff:", e);
    }
  }

  private void validateWebhookSecret() {
    if (webhookSecret == null || webhookSecret.length() < 10) {
      String error =
          String.format(
              "WEBHOOK_SECRET must be at least 10 characters long. Current length: %d",
              webhookSecret == null ? 0 : webhookSecret.length());
      log.error(error);
      throw new IllegalStateException(error);
    }
    log.info("Webhook secret validation passed");
  }
}
