import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { api } from "@/lib/api";
import { useSeo } from "@/hooks/useSeo";
import { Button } from "@/components/ui/button";

const BookingPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useSeo({
    title: "Book a Photography Session | Shivi Pareek",
    description: "Send a booking enquiry for weddings, portraits, travel, and editorial sessions.",
  });

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const response = await api.submitEnquiry(values);
      toast.success("Enquiry sent successfully.", {
        description: response.email_sent
          ? "Your message has been delivered. We will contact you shortly."
          : "Your enquiry is saved. We will contact you shortly.",
      });
      reset();
    } catch (error) {
      toast.error("Unable to send enquiry", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content-wrap page-stack" data-testid="booking-page">
      <section className="section-spacing" data-testid="booking-header-section">
        <p className="eyebrow" data-testid="booking-page-eyebrow">Enquiry</p>
        <h1 className="page-title" data-testid="booking-page-title">Book a Session</h1>
        <p className="body-text" data-testid="booking-page-description">
          Share your vision and event details. I’ll get back with availability and an approach tailored to your story.
        </p>
      </section>

      <form className="booking-form section-spacing" onSubmit={handleSubmit(onSubmit)} data-testid="booking-form">
        <div className="form-grid" data-testid="booking-form-grid">
          <label className="form-label" data-testid="booking-name-label">
            Name
            <input data-testid="booking-name-input" type="text" {...register("name", { required: "Name is required" })} />
            {errors.name ? <span className="form-error" data-testid="booking-name-error">{errors.name.message}</span> : null}
          </label>

          <label className="form-label" data-testid="booking-email-label">
            Email
            <input
              data-testid="booking-email-input"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Enter a valid email",
                },
              })}
            />
            {errors.email ? <span className="form-error" data-testid="booking-email-error">{errors.email.message}</span> : null}
          </label>

          <label className="form-label" data-testid="booking-phone-label">
            Phone
            <input data-testid="booking-phone-input" type="text" {...register("phone", { required: "Phone is required" })} />
            {errors.phone ? <span className="form-error" data-testid="booking-phone-error">{errors.phone.message}</span> : null}
          </label>

          <label className="form-label" data-testid="booking-event-type-label">
            Event Type
            <input data-testid="booking-event-type-input" type="text" {...register("event_type", { required: "Event type is required" })} />
            {errors.event_type ? <span className="form-error" data-testid="booking-event-type-error">{errors.event_type.message}</span> : null}
          </label>

          <label className="form-label" data-testid="booking-event-date-label">
            Event Date
            <input data-testid="booking-event-date-input" type="date" {...register("event_date", { required: "Date is required" })} />
            {errors.event_date ? <span className="form-error" data-testid="booking-event-date-error">{errors.event_date.message}</span> : null}
          </label>

          <label className="form-label" data-testid="booking-location-label">
            Location
            <input data-testid="booking-location-input" type="text" {...register("location", { required: "Location is required" })} />
            {errors.location ? <span className="form-error" data-testid="booking-location-error">{errors.location.message}</span> : null}
          </label>

          <label className="form-label" data-testid="booking-budget-label">
            Budget Range
            <input data-testid="booking-budget-input" type="text" {...register("budget_range", { required: "Budget is required" })} />
            {errors.budget_range ? <span className="form-error" data-testid="booking-budget-error">{errors.budget_range.message}</span> : null}
          </label>
        </div>

        <label className="form-label" data-testid="booking-message-label">
          Message
          <textarea
            data-testid="booking-message-input"
            rows={6}
            {...register("message", { required: "Please include your message" })}
          />
          {errors.message ? <span className="form-error" data-testid="booking-message-error">{errors.message.message}</span> : null}
        </label>

        <Button type="submit" disabled={isSubmitting} data-testid="booking-submit-button">
          {isSubmitting ? "Sending Enquiry..." : "Send Enquiry"}
        </Button>
      </form>
    </div>
  );
};

export default BookingPage;
