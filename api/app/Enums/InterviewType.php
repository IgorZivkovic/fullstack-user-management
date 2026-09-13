<?php

namespace App\Enums;

enum InterviewType: string
{
    case Screening = 'screening';
    case Technical = 'technical';
    case Hr = 'hr';
    case Final = 'final';
}
