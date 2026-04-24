using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VidPort.Core.Entities;
using VidPort.Infrastructure.Data;
using VidPort.Modules.Uploads.Configuration;

namespace VidPort.Modules.Profiles.Dtos;

public static class ProfileMapper
{
    public static async Task<ProfileDto> ToDto(
        Profile profile,
        ApplicationDbContext context,
        S3Options s3Options,
        Guid? viewerProfileId,
        CancellationToken ct)
    {
        var baseUrl = s3Options.ServiceUrl.TrimEnd('/');
        var bucket = s3Options.RawBucketName;

        var subscriberCount = await context.Subscriptions
            .CountAsync(s => s.CreatorId == profile.Id, ct);

        var isSubscribed = viewerProfileId.HasValue && await context.Subscriptions
            .AnyAsync(s => s.SubscriberId == viewerProfileId.Value && s.CreatorId == profile.Id, ct);

        var skills = profile.ProfileSkills
            .OrderBy(ps => ps.Skill.Name)
            .Select(ps => new SkillDto(ps.Skill.Name, ps.Stars))
            .ToList();

        var workExperiences = profile.WorkExperiences
            .OrderBy(w => w.SortOrder).ThenByDescending(w => w.StartDate)
            .Select(w => new WorkExperienceDto(w.Id, w.Company, w.Role, w.Location, w.StartDate, w.EndDate, w.IsCurrent, w.Description, w.SortOrder))
            .ToList();

        var educations = profile.Educations
            .OrderBy(e => e.SortOrder).ThenByDescending(e => e.GraduationYear)
            .Select(e => new EducationDto(e.Id, e.Institution, e.Degree, e.FieldOfStudy, e.StartYear, e.GraduationYear, e.Grade, e.Description, e.SortOrder))
            .ToList();

        var projects = profile.Projects
            .OrderBy(p => p.SortOrder)
            .Select(p => new ProjectDto(
                p.Id, p.Name, p.Description, p.Url, p.TechStack,
                p.CompletionPercentage, p.StatusDescription, p.VideoId,
                p.VideoId.HasValue ? $"{baseUrl}/{bucket}/{p.Video?.S3Key}" : null,
                p.SortOrder))
            .ToList();

        return new ProfileDto(
            profile.Id, profile.Slug, profile.Headline, profile.Bio, profile.Location,
            profile.PhoneNumber, profile.AvailabilityStatus, skills, profile.FeaturedVideoId,
            profile.FeaturedVideoId.HasValue ? $"{baseUrl}/{bucket}/{profile.FeaturedVideo?.S3Key}" : null,
            subscriberCount, isSubscribed, profile.User.Role, workExperiences, educations, projects
        );
    }

    public static IQueryable<Profile> WithFullIncludes(IQueryable<Profile> query) =>
        query
            .Include(p => p.User)
            .Include(p => p.FeaturedVideo)
            .Include(p => p.ProfileSkills).ThenInclude(ps => ps.Skill)
            .Include(p => p.WorkExperiences)
            .Include(p => p.Educations)
            .Include(p => p.Projects).ThenInclude(proj => proj.Video);
}
