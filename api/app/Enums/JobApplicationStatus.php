<?php

namespace App\Enums;

enum JobApplicationStatus: string
{
    case Saved = 'saved';
    case Applied = 'applied';
    case Interview = 'interview';
    case Offer = 'offer';
    case Rejected = 'rejected';
    case Withdrawn = 'withdrawn';
}
