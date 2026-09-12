<?php

namespace App\Http\Resources;

use App\Models\Interview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Interview */
class InterviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'job_application_id' => $this->job_application_id,
            'type' => $this->type->value,
            'scheduled_at' => $this->scheduled_at->toISOString(),
            'contact_name' => $this->contact_name,
            'contact_email' => $this->contact_email,
            'location_or_link' => $this->location_or_link,
            'notes' => $this->notes,
            'outcome' => $this->outcome?->value,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
