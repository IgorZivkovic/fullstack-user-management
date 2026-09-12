<?php

namespace App\Models;

use App\Enums\InterviewOutcome;
use App\Enums\InterviewType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'type',
    'scheduled_at',
    'contact_name',
    'contact_email',
    'location_or_link',
    'notes',
    'outcome',
])]
class Interview extends Model
{
    use HasFactory;

    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => InterviewType::class,
            'scheduled_at' => 'datetime',
            'outcome' => InterviewOutcome::class,
        ];
    }
}
